/*!
 * for.io
 *
 * Copyright (c) 2019-2020 Nikolche Mihajlovski and EPFL
 * 
 * MIT License
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

module.exports = (router, routes, middleware, api, types, providers, exceptionHandler, logger, invoker, DependencyTracker) => {

    async function run(name, handler, req, res, next, specification) {

        let _exception; // will be set if the handler throws an exception

        let _dataObjs = {}; // a cache for data objects (params, query, body, headers, cookies)

        function initDataObj(name) {
            let typeName = specification.typeNames ? specification.typeNames[name] : undefined;

            if (typeName) {
                let type = types[typeName];
                if (type) {
                    let data = type(req[name]);
                    data.validate();
                    return data;
                } else {
                    throw new Error(`Unknown type: '${typeName}'`);
                }
            } else {
                return req[name];
            }
        }

        function provideDataObj(name) {
            if (!(name in _dataObjs)) {
                _dataObjs[name] = initDataObj(name);
            }

            return _dataObjs[name];
        }

        function getDataParam(name) {
            if (req.body.hasOwnProperty(name)) return provideDataObj('body')[name];
            if (req.params.hasOwnProperty(name)) return provideDataObj('params')[name];
            if (req.query.hasOwnProperty(name)) return provideDataObj('query')[name];

            throw new Error(`Unknown parameter: '${name}'`);
        }

        function provide(name, depTracker) {
            depTracker.enter(name);

            try {
                return _provide(name, depTracker);

            } finally {
                depTracker.leave(name);
            }
        }

        // must be called only by provide(...)
        function _provide(name, depTracker) {
            if (providers.hasOwnProperty(name)) {
                return invoker.invoke(providers[name], depName => provide(depName, depTracker))
            }

            switch (name) {
                case 'req':
                    return req;

                case 'res':
                    return res;

                case 'next':
                    return next;

                case 'exception':
                    return _exception;

                case 'params':
                    return provideDataObj('params');

                case 'query':
                    return provideDataObj('query');

                case 'body':
                    return provideDataObj('body');

                case 'headers':
                    return provideDataObj('headers');

                case 'cookies':
                    return provideDataObj('cookies');

                case 'specification':
                    return specification;

                default:
                    return getDataParam(name);
            }
        }

        let result;

        const apiDepTracker = new DependencyTracker();
        apiDepTracker.enter(name);

        try {

            if (!handler) {
                throw new Error(`Cannot find the handler for API endpoint '${name}'!`);
            }

            result = await invoker.invoke(handler, depName => provide(depName, apiDepTracker));

        } catch (exception) {
            res._exception = exception; // make the exception accessible through the response (needed for the IDE)
            _exception = exception; // might be requested when invoking the exception handler

            // no custom exception handling if the response headers were already sent
            if (res.headersSent) {
                next(exception);
                return;
            }

            try {
                apiDepTracker.enter('exceptionHandler');
                result = await invoker.invoke(exceptionHandler, depName => provide(depName, apiDepTracker));
            } catch (err) {
                logger.error('An error was thrown by the exception handler!', err);
                next(err);
                return;
            }
        }

        if (result !== undefined) {
            if (typeof result === 'string') {
                res.send(result);
            } else {
                res.json(result);
            }
        }
    }

    function initRoutes(router) {
        for (const spec of routes) {
            const method = router[spec.verb.toLowerCase()].bind(router);

            const args = [spec.path];

            for (const middName of spec.middleware || []) {
                const middlewareFactory = middleware[middName];

                if (!middlewareFactory) throw new Error(`Cannot find middleware factory with name: "${middName}"`);

                args.push(middlewareFactory(spec));
            }

            args.push(async (req, res, next) => {
                await run(spec.name, api[spec.name], req, res, next, spec);
            });

            method(...args);
        }
    }

    function dispatch(request, callbacks) {
        router._dispatch(request, callbacks);
    }

    initRoutes(router);

    return { dispatch };
}
