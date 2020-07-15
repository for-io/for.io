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

const container = require('../../src/container');

test('dependency chain across modules', () => {
    const modules = {
        mod1: { $components: { foo: 'x' } },
        mod2: { $components: { bar: (foo) => foo + 'y' } },
        mod3: { $components: { baz: (bar) => bar + 'z' } },
    };

    verifyDeps({ modules });
});

test('dependency chain inside module', () => {
    const modules = {
        mod1: {
            $components: {
                foo: 'x',
                bar: (foo) => foo + 'y',
                baz: (bar) => bar + 'z',
            }
        },
    };

    verifyDeps({ modules });
});

function verifyDeps(opts) {
    const context = new container.DependencyInjection(opts);

    expect(context.getDependency('baz')).toBe('xyz');
    expect(context.getDependency('bar')).toBe('xy');
    expect(context.getDependency('foo')).toBe('x');
}