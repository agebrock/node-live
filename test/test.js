'use strict';

var chai = require('chai'),
    expect = chai.expect,
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    chance = require('chance'),
    proxyquire = require('proxyquire').noPreserveCache().noCallThru(),
    Promise = require('bluebird'),
    async = require('async'),
    chaiAsPromised = require('chai-as-promised');

require('sinon-as-promised')(Promise);
chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('main function ()', function () {

    describe('simple function', function () {
        var concatenateStringsPromised;

        function concatenateStrings(subStringOne, subStringTwo) {
            if(typeof(subStringOne) != 'string' || typeof(subStringTwo) != 'string') {
                throw new Error('Strings expected.');
            }
            return subStringOne + subStringTwo;
        }

        function concatenateStringsWithCallback(subStringOne, subStringTwo, callback) {
            setTimeout(function () {
                var result;

                try {
                    result = concatenateStrings(subStringOne, subStringTwo)
                } catch (error) {
                    return callback(error);
                }

                callback(null, result);
            }, 10);
        }

        concatenateStringsPromised = Promise.promisify(concatenateStringsWithCallback);

        describe('synchronous', function () {
            /**
             * simple functions can be tested by calling them and doing assertions on the result
             * http://chaijs.com/api/bdd/
             */
            it('should concatenate strings', function () {
                expect(concatenateStrings('a', 'b')).to.equal('ab');
                expect(concatenateStrings('ab', 'cd')).to.have.length(4);
                expect(concatenateStrings('ab', 'cd')).to.contain('bc');
                expect(concatenateStrings('ab', 'cd')).to.have.length.within(3, 5);
                // chaining and negation is possible
                expect(concatenateStrings('a', 'b'))
                    .to.equal('ab')
                    .and.not.equal('cd');
            });

            /**
             * error cases can be tested by passing a bound function to expect
             */
            it('should throw an error if any argument is not a string', function () {
                expect(concatenateStrings.bind(null, 2, 3)).to.throw('Strings expected.');
                expect(concatenateStrings.bind(null, 2, 3)).to.throw;
            });
        });

        describe('with callback', function () {
            /**
             * async functions can be tested by specifying a callback parameter and calling at the end of the test
             * assertions happen in the callback of the tested function
             * you have to test that the error doesn't exist explicitly
             */
            it('should concatenate strings', function (done) {
                concatenateStringsWithCallback('ab', 'cd', function (error, result) {
                    expect(result).to.equal('abcd');
                    expect(error).to.equal(null);
                    done();
                });
            });
            /**
             * error cases can be tested by expecting an instance of error in the callback
             */
            it('should throw an error if any argument is not a string', function (done) {
                concatenateStringsWithCallback(2, 3, function (error) {
                    expect(error)
                        .to.be.instanceOf(Error)
                        .and.to.have.property('message', 'Strings expected.');
                    done();
                });
            });
        });

        describe('with promise', function () {
            /**
             * async functions that return a promise can be tested by returning a promise
             * the eventually keyword is used to wait for promise to be resolved before doing assertions
             */
            it('should concatenate strings', function () {
               return expect(concatenateStringsPromised('ab', 'cd')).to.eventually.equal('abcd');
            });

            /**
             * error cases can be tested by using rejected or rejectedWith
             */
            it('should throw an error if any argument is not a string', function () {
               return expect(concatenateStringsPromised(2, 3)).to.be.rejectedWith('Strings expected.');
            });
        });

    });
    describe('function that needs stubbing', function () {
        function map(array, mappingFunction) {
            return array.map(mappingFunction);
        }

        function mapAsync(array, mappingFunction, callback) {
            async.map(array, mappingFunction, callback);
        }

        function mapPromise(array, mappingFunction) {
            return Promise.map(array, mappingFunction);
        }

        describe('of synchronous function', function () {
            /**
             * stub can be used to test functions that call other functions, by replacing the other functions
             * the behavior of these functions can be defined in the test
             */
            it('it should map an array', function () {
                // create the stub
                var mappingFn = sinon.stub();

                // define the behavior of the stub (if called with certain arguments)
                // withArgs only matches the number of arguments that are passed to it
                mappingFn.withArgs(1).returns(2);
                mappingFn.withArgs(2).returns(3);

                // the result is defined by the given behavior
                expect(map([ 1, 2 ], mappingFn)).to.deep.equal([ 2, 3 ]);

                // we need to test that our stub has been called with the correct arguments as well
                expect(mappingFn)
                    .to.have.been.calledTwice
                    .and.to.have.been.calledWith(1)
                    .and.to.have.been.calledWith(2);
            });
        });

        describe('of function with callback', function () {
            /**
             * if we have stubs that are async and need to call a callback we can use yields to call
             * this callback.
             * The first parameter of yields usually is null, since its the error parameter
             */
            it('should map an array', function (done) {
                var mappingFn = sinon.stub();

                // instead of returning the result we make the stub call the callback with error, elementResult
                // by using yields
                mappingFn.withArgs(1).yields(null, 2);
                mappingFn.withArgs(2).yields(null, 3);

                mapAsync([ 1, 2 ], mappingFn, function (error, result) {
                    // we shouldn't have an error
                    expect(error).not.to.be.ok;

                    expect(result).to.deep.equal([ 2, 3 ]);
                    expect(mappingFn)
                        .to.have.been.calledTwice
                        .and.to.have.been.calledWith(1)
                        .and.to.have.been.calledWith(2);

                    done();
                });
            });

            it('should callback with an error', function (done) {
                // create a stub that always calls the callback with an error
                var mappingFn = sinon.stub().yields(new Error('Test Error'));

                mapAsync([ 1, 2 ], mappingFn, function (error) {
                    expect(error)
                        .to.be.instanceOf(Error)
                        .and.to.have.property('message', 'Test Error');
                    done();
                });
            });
        });

        /**
         * if we have stubs that are async and need to return a promise we can use resolves / rejects to return
         * a promise from a stub.
         */
        describe('of function with promise', function () {
            it('should map an array', function () {
                var mappingFn = sinon.stub();

                // instead of returning a result we can also return a Promise that resolves to a specific value
                // by using resolves
                mappingFn.withArgs(1).resolves(2);
                mappingFn.withArgs(2).resolves(3);

                // return the promise to mark this as a async test
                return expect(mapPromise([ 1, 2 ], mappingFn))
                    .to.eventually.deep.equal([ 2, 3 ])
                    .then(function () {
                        // additional assertions, e.g. about calls to stubs can be done at the end of the promise chain
                        expect(mappingFn)
                            .to.have.been.calledTwice
                            .and.to.have.been.calledWith(1)
                            .and.to.have.been.calledWith(2);
                    });
            });

            it('should reject when the mappingFunction rejects', function () {
                // create a stub that always rejects
                var mappingFn = sinon.stub().rejects(new Error('Test Error'));

                return expect(mapPromise([ 1, 2 ], mappingFn))
                    .to.be.rejectedWith('Test Error');
            });
        });

        /**
         * If we need to stub a method of a (global) object we can do so in beforeEach / afterEach
         * Note that this NEEDS to be done in beforeEach/afterEach and not the test, so it is cleaned
         * up correctly after the test
         */
        describe('of method on object', function () {
            // mongoConnection is a object that is not passed to the function but global (e.g. a Model)
            var mongoConnection = {
                findOne: function () {}
            };

            function findInMongo(id) {
                return mongoConnection.findOne({
                    '_id': id,
                    otherQuery: 'bla'
                }).then(function (model) {
                    return model.name;
                });
            }

            beforeEach(function () {
                // replace the findOne by a stub
                // This needs to be done in beforeEach / afterEach otherwise it might affect other tests
                sinon.stub(mongoConnection, 'findOne');
            });

            afterEach(function () {
                // restore the mongoConnection object to it's former state
                mongoConnection.findOne.restore();
            });

            it('should find something in a database', function () {
                var model = {
                    name: 'foobar'
                };


                // we want findOne to return the model we specify
                mongoConnection.findOne.resolves(model);

                return expect(findInMongo(0))
                    .to.eventually.equal('foobar')
                    .then(function () {
                        // we need to check wether findOne has been called with the correct parameters
                        // since it always returns our model
                        expect(mongoConnection.findOne)
                            .to.have.been.calledOnce
                            .and.to.have.been.calledWith({
                                '_id': 0,
                                otherQuery: 'bla'
                            });
                    });
            });
        });

        /**
         * Time-dependent functions might need to abstract away the current time so tests are
         * reproducable.
         */
        describe('of time', function () {
            // we store the clock-stub in this variable, so it can be restored
            var clock;

            function getSecondsSinceTheBeginningOfTime() {
                var now = new Date().getTime();
                return Math.round(now / 1000);
            }

            beforeEach(function () {
                // stub the time
                // it is now set to the beginning of the unix timestamp
                clock = sinon.useFakeTimers();
            });

            afterEach(function () {
                // restore the time
                clock.restore();
            });

            it('should return the time since the beginnig of unix time', function () {
                expect(getSecondsSinceTheBeginningOfTime()).to.equal(0);
                // move the time forward by two seconds
                clock.tick(2000);
                expect(getSecondsSinceTheBeginningOfTime()).to.equal(2);
            });
        });
    });

    /**
     * Modules that depend on other modules can be loaded with proxyquire, to stub the other modules
     * .noPreserveCache() should be used so no cached versions of the module are used
     * .noCallThru() should be used to prevent using any of the stubbed modules "native" methods
     */
    describe('function that needs proxyquire', function () {

        // we dont need to use proxyquire in this case see the non-proxyquire solution below
        describe('with proxyquire', function () {
          var proxyquireMe,
              readFileSyncStub;

          beforeEach(function () {
            readFileSyncStub = sinon.stub();

            // load the module and stub the fs dependency
            proxyquireMe = proxyquire('./proxyquireMe', {
              fs: {
                readFileSync: readFileSyncStub
              }
            });
          });

          it('should read a file from disk', function () {
            var fileContent = new Buffer('asdasd');

            readFileSyncStub.returns(fileContent);

            expect(proxyquireMe.readFile()).to.equal(fileContent);
          });
        });

        // instead of proxyquiring the fs module we can also require it here and stub the readFileSync method
        describe('without proxyquire', function () {
          var fs = require('fs'),
              proxyquireMe = require('./proxyquireMe');

          beforeEach(function () {
            sinon.stub(fs, 'readFileSync');
          });

          afterEach(function () {
            fs.readFileSync.reset();
          });

          it('should read a file', function () {
            var fileContent = new Buffer('foobar');

            fs.readFileSync.returns(fileContent);

            expect(proxyquireMe.readFile()).to.equal(fileContent);
          });
        });
    });

});
