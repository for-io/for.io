/*!
 * for.io
 *
 * Copyright (c) 2019-2020 Nikolche Mihajlovski
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

const { runTest } = require('api-diligence');
const appFactory = require('../src/appFactory');

class Test {

    constructor(name, appSetup) {
        this.name = name;
        this.appSetup = appSetup;
        this.cases = [];
    }

    expect(request, responseBody, responseCode = 200) {
        this.cases.push({
            steps: [{ request, [responseCode]: responseBody }],
        });

        return this;
    }

    run() {
        runTest({
            name: this.name,
            opts: { appSetup: this.appSetup, appFactory },
            cases: this.cases,
        });
    }

}

function test(name, appSetup) {
    return new Test(name, appSetup);
}

module.exports = { test };