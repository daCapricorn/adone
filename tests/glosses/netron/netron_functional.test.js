const { is, x, netron: { DEFAULT_PORT, Netron, decorator: { Private, Readonly, Type, Args, Description, Property, Contextable } } } = adone;

let defaultPort = DEFAULT_PORT;
let NETRON_PORT = 32348;

describe("Netron", () => {
    let exNetron;
    let superNetron;

    before(async () => {
        async function isFreePort(port, host = null) {
            const checkerSocket = new adone.std.net.Server();
            const p = new Promise((resolve, reject) => {
                checkerSocket.on("error", (e) => {
                    if (e.code === "EADDRINUSE") {
                        resolve(false);
                    } else {
                        reject(e);
                    }
                }).on("listening", () => {
                    checkerSocket.on("close", () => {
                        resolve(true);
                    });
                    checkerSocket.close();
                });
            });
            checkerSocket.listen(port, host);
            return p;
        }

        function getRandomPort() {
            return 1025 + Math.round(Math.random() * 64510);
        }

        while (!await isFreePort(defaultPort)) {
            defaultPort = getRandomPort();
        }
        while (NETRON_PORT === defaultPort || !await isFreePort(NETRON_PORT)) {
            NETRON_PORT = getRandomPort();
        }
    });

    beforeEach(async () => {
        exNetron = new Netron();
        superNetron = new Netron({ isSuper: true });
    });

    afterEach(async () => {
        await exNetron.disconnect();
        await superNetron.unbind();
    });

    describe("Functional tests", () => {
        describe("Unix-Sockets and Windows-pipes", () => {
            const SOCKET_PIPE = is.win32 ? "\\\\.\\pipe\\adone_test_pipe" : "test_socket.sock";

            it("two connections", async () => {
                await superNetron.bind({ port: SOCKET_PIPE });

                const n1 = new Netron();
                const n2 = new Netron();
                try {
                    await n1.connect({ port: SOCKET_PIPE });
                    await n2.connect({ port: SOCKET_PIPE });
                } catch (e) {
                    superNetron.disconnect();
                    throw e;
                }

                const superNetronPeers = superNetron.getPeers();
                assert.isOk(superNetronPeers.has(n1.uid));
                assert.isOk(superNetronPeers.has(n2.uid));
                superNetron.disconnect();
            });
        });

        it("Connection: [1] -> [2] -> [3]", async () => {
            const first = new Netron();
            const second = new Netron();
            const third = new Netron();
            let peerFirstToSecond;
            let peerSecondToThird;
            second.bind();
            third.bind({ port: NETRON_PORT, host: "127.0.0.1" });

            try {
                peerFirstToSecond = await first.connect();
                peerSecondToThird = await second.connect({ port: NETRON_PORT, host: "127.0.0.1" });
            } catch (e) {
                assert.ifError(e);
            }

            assert.isOk(peerFirstToSecond);
            assert.isOk(peerSecondToThird);
            assert.equal(peerFirstToSecond.uid, second.uid);
            assert.equal(peerSecondToThird.uid, third.uid);
            first.disconnect();
            second.disconnect();
            second.unbind();
            third.disconnect();
            third.unbind();
        });

        describe("Events order", () => {
            it("Server", async () => {
                let index = 0;

                const p1 = new Promise((resolve, reject) => {
                    superNetron.on("peer create", async () => {
                        try {
                            assert.equal(index++, 0);
                            await adone.promise.delay(300);
                            resolve();
                        } catch (e) {
                            reject(e);
                        }
                    });
                });

                const p2 = new Promise((resolve, reject) => {
                    superNetron.on("peer connect", async () => {
                        try {
                            assert.equal(index++, 1);
                            await adone.promise.delay(200);
                            resolve();
                        } catch (e) {
                            reject(e);
                        }
                    });
                });

                const p3 = new Promise((resolve, reject) => {
                    superNetron.on("peer online", async () => {
                        try {
                            assert.equal(index++, 2);
                            await adone.promise.delay(100);
                            resolve();
                        } catch (e) {
                            reject(e);
                        }
                    });
                });

                const p4 = new Promise((resolve, reject) => {
                    superNetron.on("peer offline", () => {
                        try {
                            assert.equal(index, 3);
                            resolve();
                        } catch (e) {
                            reject(e);
                        }
                    });
                });

                await superNetron.bind();
                await exNetron.connect();
                exNetron.disconnect();

                return Promise.all( [p1, p2, p3, p4] );
            });

            it("Client", async () => {
                let index = 0;

                const p1 = new Promise((resolve, reject) => {
                    exNetron.on("peer create", async () => {
                        try {
                            assert.equal(index++, 0);
                            await adone.promise.delay(300);
                            resolve();
                        } catch (e) {
                            reject(e);
                        }
                    });
                });

                const p2 = new Promise((resolve, reject) => {
                    exNetron.on("peer connect", async () => {
                        try {
                            assert.equal(index++, 1);
                            await adone.promise.delay(200);
                            resolve();
                        } catch (e) {
                            reject(e);
                        }
                    });
                });

                const p3 = new Promise((resolve, reject) => {
                    exNetron.on("peer online", async () => {
                        try {
                            assert.equal(index++, 2);
                            await adone.promise.delay(100);
                            resolve();
                        } catch (e) {
                            reject(e);
                        }
                    });
                });

                const p4 = new Promise((resolve, reject) => {
                    exNetron.on("peer offline", () => {
                        try {
                            assert.equal(index, 3);
                            resolve();
                        } catch (e) {
                            reject(e);
                        }
                    });
                });

                await superNetron.bind();
                await exNetron.connect();
                exNetron.disconnect();

                return Promise.all( [p1, p2, p3, p4] );
            });
        });

        describe("RPC", () => {
            @Contextable
            class ContextA {
                @Private
                getValue2() {
                    return this.prop2;
                }

                @Type(String)
                getValue1() {
                    return this.prop1;
                }

                @Args(String)
                setValue1(value) {
                    this.prop1 = value;
                }

                @Private
                prop1 = "prop1";

                @Readonly
                @Type(String)
                prop2 = "prop2";

                @Type(String)
                prop3 = "prop3";
            }

            it("local - methods call", async () => {
                const ctx = new ContextA();
                const defID = superNetron.attachContext(ctx, "a");
                let propVal = await superNetron.call(null, defID, "getValue1");
                expect(propVal).to.be.equal("prop1");
                await superNetron.callVoid(null, defID, "setValue1", "newProp1");
                propVal = await superNetron.call(null, defID, "getValue1");
                expect(propVal).to.be.equal("newProp1");
                try {
                    propVal = await superNetron.call(null, defID, "getValue2");
                } catch (err) {
                    assert.instanceOf(err, adone.x.NotExists);
                    return;
                }
                assert.fail("Did not thrown any error");
            });

            it("remote - methods call", async () => {
                const ctx = new ContextA();
                superNetron.attachContext(ctx, "a");
                await superNetron.bind();
                const peer = await exNetron.connect();
                const defID = peer.getDefinitionByName("a").id;
                let propVal = await exNetron.call(peer.uid, defID, "getValue1");
                expect(propVal).to.be.equal("prop1");
                await exNetron.callVoid(peer.uid, defID, "setValue1", "newProp1");
                propVal = await exNetron.call(peer.uid, defID, "getValue1");
                expect(propVal).to.be.equal("newProp1");
                try {
                    propVal = await exNetron.call(peer.uid, defID, "getValue2");
                } catch (err) {
                    assert.instanceOf(err, adone.x.NotExists);
                    return;
                }
                assert.fail("Did not thrown any error");
            });

            it("local - properties access", async () => {
                const ctx = new ContextA();
                const defID = superNetron.attachContext(ctx, "a");
                let propVal;
                let isOK = false;
                try {
                    propVal = await superNetron.get(null, defID, "prop1");
                } catch (err) {
                    isOK = err instanceof adone.x.NotExists;
                }
                expect(isOK).to.be.true;
                propVal = await superNetron.get(null, defID, "prop2");
                expect(propVal).to.be.equal("prop2");
                isOK = false;
                try {
                    await superNetron.set(null, defID, "prop2", "newProp2");
                } catch (err) {
                    isOK = err instanceof adone.x.InvalidAccess;
                }
                expect(isOK).to.be.true;
                await superNetron.set(null, defID, "prop3", "newProp3");
                propVal = await superNetron.call(null, defID, "prop3");
                expect(propVal).to.be.equal("newProp3");
            });

            it("remote - properties access", async () => {
                const ctx = new ContextA();
                superNetron.attachContext(ctx, "a");
                await superNetron.bind();
                const peer = await exNetron.connect();
                const defID = peer.getDefinitionByName("a").id;
                let propVal;
                let isOK = false;
                try {
                    propVal = await exNetron.get(peer.uid, defID, "prop1");
                } catch (err) {
                    isOK = err instanceof adone.x.NotExists;
                }
                expect(isOK).to.be.true;
                propVal = await exNetron.get(peer.uid, defID, "prop2");
                expect(propVal).to.be.equal("prop2");
                isOK = false;
                try {
                    await exNetron.set(peer.uid, defID, "prop2", "newProp2");
                } catch (err) {
                    isOK = err instanceof adone.x.InvalidAccess;
                }
                expect(isOK).to.be.true;
                await exNetron.set(peer.uid, defID, "prop3", "newProp3");
                propVal = await exNetron.get(peer.uid, defID, "prop3");
                expect(propVal).to.be.equal("newProp3");
            });
        });

        describe("Interfacing", () => {
            const DocumentTypes = {
                number: 1,
                string: 2,
                boolean: 3,
                object: 4,
                array: 5,
                map: 6,
                set: 7,
                date: 8
            };

            @Contextable
            @Description("Object document")
            @Property("type", { readonly: true })
            @Property("data", { readonly: true })
            @Contextable
            class Document {
                constructor(data, type) {
                    this.data = data;
                    this.type = type;
                }

                @Description("Returns string representation of document")
                @Type(String)
                @Args(Object)
                inspect(options) {
                    return adone.std.util.inspect(this.data, options);
                }
            }

            @Contextable
            @Description("Simple object storage")
            @Property("name", { type: String, description: "Name of the storage" })
            @Property("_totalSize", { private: true })
            class ObjectStorage {
                constructor(name, size) {
                    this.name = name;
                    this._totalSize = size;
                }

                @Description("Returns total size of storage")
                @Type(Number)
                getCapacity() {
                    return this._totalSize;
                }

                @Description("Sets new size of storage")
                @Type(Number)
                @Args(Number)
                setCapacity(size) {
                    this._totalSize = size;
                }

                @Description("Returns supported document types")
                @Type(Object)
                supportedDocTypes() {
                    return DocumentTypes;
                }

                @Type(Number)
                getSize() {
                    return this._docs.size;
                }

                @Description("Adds document. Returns 'true' if document added to storage, otherwise 'false'")
                @Args(String, Document)
                @Type(Boolean)
                addDocument(name, doc) {
                    if (this._docs.size >= this._totalSize || this._docs.has(name)) {
                        return false;
                    } else {
                        this._docs.set(name, doc);
                    }
                    return true;
                }

                @Description("Returns document by name")
                @Type(Document)
                @Args(String)
                getDocument(name) {
                    return this._docs.get(name) || null;
                }

                createDocument(data, type) {
                    return new Document(data, type);
                }

                @Private
                _docs = new Map();
            }

            describe("Base interfacing", () => {
                it("local", async () => {
                    const storage = new ObjectStorage("unknown", 1024);
                    const defID = superNetron.attachContext(storage, "storage");
                    const iStorage = superNetron.getInterfaceById(defID);
                    expect(is.nil(iStorage)).to.be.false;
                    expect(is.netronInterface(iStorage)).to.be.true;
                    let name = await iStorage.name.get();
                    expect(name).to.be.equal("unknown");
                    await iStorage.name.set("simplestore");
                    name = await iStorage.name.get();
                    expect(name).to.be.equal("simplestore");
                    let size = await iStorage.getCapacity();
                    expect(size).to.be.equal(1024);
                    await iStorage.setCapacity(2048);
                    size = await iStorage.getCapacity();
                    expect(size).to.be.equal(2048);
                });

                it("remote", async () => {
                    const storage = new ObjectStorage("unknown", 1024);
                    superNetron.attachContext(storage, "storage");
                    await superNetron.bind();
                    const peer = await exNetron.connect();
                    const iStorage = peer.getInterfaceById(peer.getDefinitionByName("storage").id);
                    expect(is.nil(iStorage)).to.be.false;
                    expect(is.netronInterface(iStorage)).to.be.true;
                    let name = await iStorage.name.get();
                    expect(name).to.be.equal("unknown");
                    await iStorage.name.set("simplestore");
                    name = await iStorage.name.get();
                    expect(name).to.be.equal("simplestore");
                    let size = await iStorage.getCapacity();
                    expect(size).to.be.equal(1024);
                    await iStorage.setCapacity(2048);
                    size = await iStorage.getCapacity();
                    expect(size).to.be.equal(2048);
                });
            });

            describe("Advanced interfacing with weak contexts", () => {
                it("local - get of remotely created object", async () => {
                    const idea = "To get out of difficulty, one usually must go throught it";
                    const storage = new ObjectStorage("simplestore", 3);
                    storage.addDocument("idea", new Document(idea, DocumentTypes.string));
                    const defID = superNetron.attachContext(storage, "storage");
                    const iStorage = superNetron.getInterfaceById(defID);
                    const size = await iStorage.getSize();
                    expect(size).to.be.equal(1);
                    const iDoc1 = await iStorage.getDocument("idea");
                    const data = await iDoc1.data.get();
                    expect(data).to.be.equal(idea);
                });

                it("remote - get of remotely created object", async () => {
                    const idea = "To get out of difficulty, one usually must go throught it";
                    const storage = new ObjectStorage("simplestore", 3);
                    storage.addDocument("idea", new Document(idea, DocumentTypes.string));
                    superNetron.attachContext(storage, "storage");
                    await superNetron.bind();
                    const peer = await exNetron.connect();
                    const iStorage = peer.getInterfaceById(peer.getDefinitionByName("storage").id);
                    const size = await iStorage.getSize();
                    expect(size).to.be.equal(1);
                    const iDoc1 = await iStorage.getDocument("idea");
                    const data = await iDoc1.data.get();
                    expect(data).to.be.equal(idea);
                });

                it("local - create remote object, pass it to other remote object and get it from there", async () => {
                    const idea = "To get out of difficulty, one usually must go throught it";
                    const storage = new ObjectStorage("simplestore", 3);
                    const defID = superNetron.attachContext(storage, "storage");
                    const iStorage = superNetron.getInterfaceById(defID);
                    const iDoc = await iStorage.createDocument(idea, DocumentTypes.string);//iFactory.create("Document", idea, DocumentTypes.string);
                    await iStorage.addDocument("idea", iDoc);
                    const iDocSame = await iStorage.getDocument("idea");
                    const data = await iDocSame.data.get();
                    expect(data).to.be.equal(idea);
                    expect(is.deepEqual(iDoc.$def, iDocSame.$def)).to.be.true;
                });

                it("remote - create remote object, pass it to other remote object and get it from there", async () => {
                    const idea = "To get out of difficulty, one usually must go throught it";
                    const storage = new ObjectStorage("simplestore", 3);
                    superNetron.attachContext(storage, "storage");
                    await superNetron.bind();
                    const peer = await exNetron.connect();
                    const iStorage = peer.getInterfaceById(peer.getDefinitionByName("storage").id);
                    const iDoc = await iStorage.createDocument(idea, DocumentTypes.string);//await iFactory.create("Document", idea, DocumentTypes.string);
                    await iStorage.addDocument("idea", iDoc);
                    const iDocSame = await iStorage.getDocument("idea");
                    const data = await iDocSame.data.get();
                    expect(data).to.be.equal(idea);
                    expect(is.deepEqual(iDoc.$def, iDocSame.$def)).to.be.true;
                });
            });

            describe("Multiple definitions", () => {
                @Contextable
                class NumField {
                    constructor(val) {
                        this._val = val;
                    }

                    getValue() {
                        return this._val;
                    }
                }

                @Contextable
                class NumSet {
                    getFields(start, end) {
                        const defs = new adone.netron.Definitions();
                        for (let i = start; i < end; i++) {
                            defs.push(new NumField(i));
                        }
                        return defs;
                    }

                    setFields(fields) {
                        this._fields = fields;
                    }
                }

                it("get multiple definitions", async () => {
                    const numSet = new NumSet();
                    superNetron.attachContext(numSet, "numset");
                    await superNetron.bind();
                    const peer = await exNetron.connect();
                    const iNumSet = peer.getInterfaceByName("numset");
                    const defs = await iNumSet.getFields(0, 8);
                    expect(defs.length).to.be.equal(8);
                    for (let i = 0; i < defs.length; i++) {
                        const def = defs.get(i);
                        expect(await def.getValue()).to.be.equal(i);
                    }
                });

                it("get multiple definitions through super-netron", async () => {
                    const numSet = new NumSet();
                    await superNetron.bind();
                    const peer = await exNetron.connect();
                    await exNetron.attachContextRemote(peer.uid, numSet, "numset");
                    const exNetron2 = new adone.netron.Netron();
                    const peer2 = await exNetron2.connect();
                    const iNumSet = peer2.getInterfaceByName("numset");
                    const defs = await iNumSet.getFields(0, 8);
                    expect(defs.length).to.be.equal(8);
                    for (let i = 0; i < defs.length; i++) {
                        const def = defs.get(i);
                        expect(await def.getValue()).to.be.equal(i);
                    }
                    await exNetron2.disconnect();
                });

                it("set multiple definitions (control inversion)", async () => {
                    const numSet = new NumSet();
                    superNetron.attachContext(numSet, "numset");
                    await superNetron.bind();
                    const peer = await exNetron.connect();
                    const iNumSet = peer.getInterfaceByName("numset");
                    const fields = new adone.netron.Definitions();
                    for (let i = 0; i < 10; i++) {
                        fields.push(new NumField(i));
                    }
                    await iNumSet.setFields(fields);
                    expect(numSet._fields.length).to.be.equal(10);
                    for (let i = 0; i < numSet._fields.length; i++) {
                        const def = numSet._fields.get(i);
                        expect(await def.getValue()).to.be.equal(i);
                    }
                });

                it("set multiple definitions through super-netron (control inversion)", async () => {
                    const numSet = new NumSet();
                    await superNetron.bind();
                    const peer = await exNetron.connect();
                    await exNetron.attachContextRemote(peer.uid, numSet, "numset");
                    const exNetron2 = new adone.netron.Netron();
                    const peer2 = await exNetron2.connect();
                    const iNumSet = peer2.getInterfaceByName("numset");
                    const fields = new adone.netron.Definitions();
                    for (let i = 0; i < 10; i++) {
                        fields.push(new NumField(i));
                    }
                    await iNumSet.setFields(fields);
                    expect(numSet._fields.length).to.be.equal(10);
                    for (let i = 0; i < numSet._fields.length; i++) {
                        const def = numSet._fields.get(i);
                        expect(await def.getValue()).to.be.equal(i);
                    }
                    await exNetron2.disconnect();
                });
            });

            describe("Inverse object interfacing", () => {
                const BodyStatuses = {
                    Dead: 0,
                    Alive: 1
                };

                @Contextable
                class Soul {
                    constructor(name) {
                        this.name = name;
                    }

                    eatVitality(percentage) {
                        this.vitality -= percentage;
                        if (this.vitality <= 0) {
                            this.bodyStatus = BodyStatuses.Dead;
                        }
                    }

                    doEvil(otherSoul, percentage) {
                        return otherSoul.eatVitality(percentage);
                    }

                    vitality = 100;
                    bodyStatus = BodyStatuses.Alive;
                }

                @Contextable
                class Devil {
                    sellSoul(manName, iSoul) {
                        if (this.souls.has(manName)) {
                            return false;
                        }
                        this.souls.set(manName, iSoul);
                        return true;
                    }

                    possess(manName) {
                        const iSoul = this.souls.get(manName);
                        if (!is.undefined(iSoul)) {
                            this.possessedSoul = iSoul;
                        }
                    }

                    takeVitality(percentage) {
                        if (!is.undefined(this.possessedSoul)) {
                            return this.possessedSoul.eatVitality(percentage);
                        }
                    }

                    doEvil(manName, percentage) {
                        if (!is.undefined(this.possessedSoul)) {
                            return this.possessedSoul.doEvil(this.souls.get(manName), percentage);
                        }
                    }

                    @Type(Map)
                    souls = new Map();

                    possessedSoul = null;
                }

                it("local", async () => {
                    const peter = new Soul("Peter");
                    const mike = new Soul("Mike");
                    const devil = new Devil();
                    const defID = superNetron.attachContext(devil, "devil");
                    const iDevil = superNetron.getInterfaceById(defID);

                    await iDevil.sellSoul(peter.name, peter);
                    await iDevil.sellSoul(mike.name, mike);
                    devil.possess("Mike");
                    await devil.takeVitality(50);
                    expect(mike.vitality).to.be.equal(50);
                    devil.possess("Peter");
                    await devil.takeVitality(100);
                    expect(peter.vitality).to.be.equal(0);
                    expect(peter.bodyStatus).to.be.equal(BodyStatuses.Dead);
                });

                it("remote", async () => {
                    const peter = new Soul("Peter");
                    const mike = new Soul("Mike");
                    const devil = new Devil();
                    superNetron.attachContext(devil, "devil");
                    await superNetron.bind();
                    const peer = await exNetron.connect();
                    const iDevil = peer.getInterfaceById(peer.getDefinitionByName("devil").id);

                    await iDevil.sellSoul(peter.name, peter);
                    await iDevil.sellSoul(mike.name, mike);
                    devil.possess("Mike");
                    await devil.takeVitality(50);
                    expect(mike.vitality).to.be.equal(50);
                    devil.possess("Peter");
                    await devil.takeVitality(100);
                    expect(peter.vitality).to.be.equal(0);
                    expect(peter.bodyStatus).to.be.equal(BodyStatuses.Dead);
                });

                it("local - more complex", async () => {
                    const peter = new Soul("Peter");
                    const mike = new Soul("Mike");
                    const devil = new Devil();
                    const defID = superNetron.attachContext(devil, "devil");
                    const iDevil = superNetron.getInterfaceById(defID);

                    await iDevil.sellSoul(peter.name, peter);
                    await iDevil.sellSoul(mike.name, mike);
                    devil.possess("Mike");
                    await devil.takeVitality(50);
                    expect(mike.vitality).to.be.equal(50);
                    devil.possess("Peter");
                    await devil.takeVitality(100);
                    expect(peter.vitality).to.be.equal(0);
                    expect(peter.bodyStatus).to.be.equal(BodyStatuses.Dead);
                    await devil.doEvil("Mike", 50);
                    const iMikeSoul = devil.souls.get("Mike");
                    const mikeVitality = await iMikeSoul.vitality.get();
                    const mikeBodyStatus = await iMikeSoul.bodyStatus.get();
                    expect(mikeVitality).to.be.equal(0);
                    expect(mikeBodyStatus).to.be.equal(BodyStatuses.Dead);
                });

                it("remote - more complex", async () => {
                    const peter = new Soul("Peter");
                    const mike = new Soul("Mike");
                    const devil = new Devil();
                    superNetron.attachContext(devil, "devil");
                    await superNetron.bind();
                    const peer = await exNetron.connect();
                    const iDevil = peer.getInterfaceById(peer.getDefinitionByName("devil").id);

                    await iDevil.sellSoul(peter.name, peter);
                    await iDevil.sellSoul(mike.name, mike);
                    devil.possess("Mike");
                    await devil.takeVitality(50);
                    expect(mike.vitality).to.be.equal(50);
                    devil.possess("Peter");
                    await devil.takeVitality(100);
                    expect(peter.vitality).to.be.equal(0);
                    expect(peter.bodyStatus).to.be.equal(BodyStatuses.Dead);
                    await devil.doEvil("Mike", 50);
                    const iMikeSoul = devil.souls.get("Mike");
                    const mikeVitality = await iMikeSoul.vitality.get();
                    const mikeBodyStatus = await iMikeSoul.bodyStatus.get();
                    expect(mikeVitality).to.be.equal(0);
                    expect(mikeBodyStatus).to.be.equal(BodyStatuses.Dead);
                });
            });

            describe("Weak-contexts", () => {
                @Contextable
                class Weak {
                    doSomething() {
                        return 888;
                    }
                }

                @Contextable
                class Strong {
                    constructor(netron) {
                        this.netron = netron;
                        this.weak = new Weak();
                    }
                    getWeak() {
                        return this.weak;
                    }

                    releaseWeak() {
                        this.netron.releaseContext(this.weak);
                        this.weak = null;
                    }
                }

                it("call released context", async () => {
                    superNetron.attachContext(new Strong(superNetron), "strong");

                    exNetron = new adone.netron.Netron();

                    await superNetron.bind();
                    const peer = await exNetron.connect();
                    const iStrong = peer.getInterfaceByName("strong");
                    const iWeak = await iStrong.getWeak();
                    assert.equal(await iWeak.doSomething(), 888);
                    await iStrong.releaseWeak();
                    try {
                        await iWeak.doSomething();
                    } catch (err) {
                        assert.isOk(err instanceof adone.x.NotExists);
                        assert.equal(err.message, "Context not exists");
                        return;
                    }
                    assert.fail("should throw exception");
                });

                it("deep contexting", async () => {
                    let depthLabel;

                    @Contextable
                    class CounterKeeper {
                        constructor(keeper = null) {
                            this.keeper = keeper;
                        }

                        async getCounter() {
                            if (this.keeper) {
                                depthLabel++;
                                return (await this.keeper.getCounter()) + 1;
                            } else {
                                return 1;
                            }
                        }

                        async getNextKeeper(keeper) {
                            return new CounterKeeper(keeper);
                        }
                    }

                    await superNetron.attachContext(new CounterKeeper(), "keeper");
                    await superNetron.bind();
                    const superNetronPeer = await exNetron.connect();
                    let keeper = superNetronPeer.getInterfaceByName("keeper");
                    let counter = 1;
                    assert.strictEqual(await keeper.getCounter(), counter);
                    while (counter < 30) {
                        keeper = new CounterKeeper(keeper);
                        assert.strictEqual(await keeper.getCounter(), ++counter);
                        keeper = await keeper.getNextKeeper(keeper);
                        depthLabel = 1;
                        assert.strictEqual(await keeper.getCounter(), ++counter);
                        assert.strictEqual(depthLabel, counter);
                    }
                });

                describe("complex weak-context inversion", () => {

                    let n1;
                    let n2;

                    afterEach(async () => {
                        await n2.disconnect();
                        await adone.promise.delay(100);
                        await n1.disconnect();

                        await superNetron.disconnect();
                        await superNetron.unbind();
                    });

                    it("complex weak-context inversion", async () => {

                        @Contextable
                        class PM {
                            on(handle) {
                                return handle.emit();
                            }
                        }

                        @Contextable
                        class Handle {
                            emit() {
                                return adone.ok;
                            }
                        }

                        @Contextable
                        class System {
                            constructor(pm) {
                                this.pm = pm;
                            }

                            register() {
                                return this.pm.on(new Handle());
                            }
                        }

                        superNetron = new adone.netron.Netron({ isSuper: true });
                        await superNetron.bind();

                        n1 = new adone.netron.Netron();
                        const client1 = await n1.connect();
                        await n1.attachContextRemote(superNetron.uid, new PM(), "pm");

                        n2 = new adone.netron.Netron();
                        const client2 = await n2.connect();
                        await n2.attachContextRemote(superNetron.uid, new System(client2.getInterfaceByName("pm")), "system");

                        await adone.promise.delay(200);
                        const system = client1.getInterfaceByName("system");

                        const answer = await system.register();
                        assert.strictEqual(answer, adone.ok);
                    });
                });

                describe.skip("cycle weak-context transmission", () => {

                    let n1;
                    let n2;

                    afterEach(async () => {
                        await n1.disconnect();
                        await n1.unbind();
                        await superNetron.disconnect();
                        await superNetron.unbind();
                    });

                    it.skip("cycle weak-context transmission", async () => {

                        @Contextable
                        class Ball {
                            hit() {
                                return "bounce";
                            }
                        }

                        @Contextable
                        class Basket {
                            constructor() {
                                this.ball = null;
                            }

                            putBall(ball) {
                                assert.instanceOf(ball, adone.netron.Interface);
                                this.ball = ball;
                            }

                            getBall() {
                                return this.ball;
                            }
                        }

                        superNetron = new adone.netron.Netron({ isSuper: true });
                        await superNetron.bind();

                        // n1 provides basket to Server
                        n1 = new adone.netron.Netron();
                        await n1.connect();
                        const basket = new Basket();
                        await n1.attachContextRemote(superNetron.uid, basket, "basket");

                        // n2 put ball in basket via Server
                        n2 = new adone.netron.Netron();
                        const client2toS = await n2.connect();
                        const remoteBasket = await client2toS.getInterfaceByName("basket");
                        await remoteBasket.putBall(new Ball());

                        // n1 get n2's ball from basket on Server
                        let ball = basket.getBall();
                        assert.isOk(ball);
                        assert.equal(await ball.hit(), "bounce");
                        // and put it on another basket
                        let anotherBasket = new Basket();
                        anotherBasket.putBall(ball);
                        n1.attachContext(anotherBasket, "basket");

                        // n2 returns his ball from n1 and hit it
                        await n1.bind({ port: 12509 });
                        const client2to1 = await n2.connect({ port: 12509 });
                        assert.equal(client2to1.uid, n1.uid);
                        anotherBasket = await client2to1.getInterfaceByName("basket");
                        ball = await anotherBasket.getBall();
                        assert.equal(ball.hit(), "bounce");
                    });
                });
            });

            describe("Exceptions", () => {                
                @Contextable
                class A {
                    throwError() {
                        throw new Error("description");
                    }

                    throwEvalError() {
                        throw new EvalError("description");
                    }

                    throwRangeError() {
                        throw new RangeError("description");
                    }

                    throwReferenceError() {
                        throw new ReferenceError("description");
                    }

                    throwSyntaxError() {
                        throw new SyntaxError("description");
                    }

                    throwTypeError() {
                        throw new TypeError("description");
                    }

                    throwURIError() {
                        throw new URIError("description");
                    }


                    throwException() {
                        throw new x.Exception("description");
                    }
                    throwRuntime() {
                        throw new x.Runtime("description");
                    }
                    throwIncompleteBufferError() {
                        throw new x.IncompleteBufferError("description");
                    }
                    throwNotImplemented() {
                        throw new x.NotImplemented("description");
                    }
                    throwIllegalState() {
                        throw new x.IllegalState("description");
                    }
                    throwNotValid() {
                        throw new x.NotValid("description");
                    }
                    throwUnknown() {
                        throw new x.Unknown("description");
                    }
                    throwNotExists() {
                        throw new x.NotExists("description");
                    }
                    throwExists() {
                        throw new x.Exists("description");
                    }
                    throwEmpty() {
                        throw new x.Empty("description");
                    }
                    throwInvalidAccess() {
                        throw new x.InvalidAccess("description");
                    }
                    throwNotSupported() {
                        throw new x.NotSupported("description");
                    }
                    throwInvalidArgument() {
                        throw new x.InvalidArgument("description");
                    }
                    throwInvalidNumberOfArguments() {
                        throw new x.InvalidNumberOfArguments("description");
                    }
                    throwNotFound() {
                        throw new x.NotFound("description");
                    }
                    throwTimeout() {
                        throw new x.Timeout("description");
                    }
                    throwIncorrect() {
                        throw new x.Incorrect("description");
                    }
                    throwNotAllowed() {
                        throw new x.NotAllowed("description");
                    }
                    throwLimitExceeded() {
                        throw new x.LimitExceeded("description");
                    }
                    throwNetwork() {
                        throw new x.Network("description");
                    }
                    throwBind() {
                        throw new x.Bind("description");
                    }
                    throwConnect() {
                        throw new x.Connect("description");
                    }
                }

                for (const i of ["local", "remote"]) {
                    it(`${i} - standart exceptions`, async() => {
                        let okCount = 0;
                        superNetron.attachContext(new A(), "a");
                        await superNetron.bind({ port: NETRON_PORT });
                        
                        let iA;
                        if (i === "local") {
                            iA = superNetron.getInterfaceByName("a");
                        } else {
                            const peer = await exNetron.connect({ port: NETRON_PORT });
                            iA = peer.getInterfaceByName("a");
                        }
                        const stdErrors = adone.x.stdExceptions;
                        for (const StdError of stdErrors) {
                            try {
                                await iA[`throw${StdError.prototype.name}`]();
                            } catch (err) {
                                okCount += (err instanceof StdError ? 1 : 0);
                            }    
                        }
                        assert.isOk(okCount === stdErrors.length);
                    });
                }

                for (const i of ["local", "remote"]) {
                    it(`${i} - adone exceptions`, async() => {
                        let okCount = 0;
                        superNetron.attachContext(new A(), "a");
                        await superNetron.bind({ port: NETRON_PORT });
                        
                        let iA;
                        if (i === "local") {
                            iA = superNetron.getInterfaceByName("a");
                        } else {
                            const peer = await exNetron.connect({ port: NETRON_PORT });
                            iA = peer.getInterfaceByName("a");
                        }
                        const adoneErrors = adone.x.adoneExceptions;
                        for (const AdoneError of adoneErrors) {
                            try {
                                await iA[`throw${AdoneError.prototype.name}`]();
                            } catch (err) {
                                okCount += (err instanceof AdoneError ? 1 : 0);
                            }    
                        }
                        assert.isOk(okCount === adoneErrors.length);
                    });
                }
            });
        });

        describe("Referencing contexts", () => {
            @Contextable
            class TheC {
                getValue() {
                    return 8;
                }
            }

            @Contextable
            class TheB {
                constructor() {
                    this.theC = new TheC(); 
                }
                originateC() {
                    return this.theC;
                }

                updateC(c) {
                    this.theC = c;
                }
            }

            @Contextable
            class TheA {
                constructor() {
                    this.theB = new TheB();
                    this.theC = new TheC();
                }

                originateB() {
                    return this.theB;
                }

                updateB(b) {
                    this.theB = b;
                }

                makeUpdateOnB() {
                    return this.theB.updateC(this.theC);
                }
            }

            it("obtain unknown interfaces after detach context", async () => {
                const theA = new TheA();
                superNetron.attachContext(theA, "a");
                await superNetron.bind();
                const peer = await exNetron.connect();
                const iTheA = peer.getInterfaceByName("a");
                const aDefId = iTheA.$def.id;
                assert.equal(aDefId, superNetron.getDefinitionByName("a").id);
                await superNetron.detachContext("a");
                await adone.promise.delay(100);
                assert.throws(() => {
                    superNetron.getInterfaceById(aDefId);
                }, adone.x.Unknown);
                assert.throws(() => {
                    peer.getInterfaceById(aDefId);
                }, adone.x.Unknown);
            });

            it("obtain unknown interfaces after disconnect", async () => {
                const theA = new TheA();
                superNetron.attachContext(theA, "a");
                await superNetron.bind();
                const peer = await exNetron.connect();
                const iTheA = peer.getInterfaceByName("a");
                const theB = new TheB();
                await iTheA.updateB(theB);
                const aDefId = iTheA.$def.id;
                assert.equal(aDefId, superNetron.getDefinitionByName("a").id);
                await exNetron.disconnect();
                await adone.promise.delay(100);
                assert.throws(() => {
                    const iA = peer.getInterfaceById(aDefId);
                    iA.originateB();
                }, adone.x.Unknown);
            });

            it("inverse object manupulation stub referencing", async () => {
                const theA = new TheA();
                superNetron.attachContext(theA, "a");
                await superNetron.bind();
                const peer = await exNetron.connect();
                const iTheA = peer.getInterfaceByName("a");
                const theB = new TheB(); 
                await iTheA.updateB(theB);
                await iTheA.makeUpdateOnB();
                assert.equal(superNetron._stubs.size, 2);
                assert.equal(exNetron._stubs.size, 1);
                await exNetron.disconnect();
                await adone.promise.delay(100);
                superNetron.detachContext("a");
                assert.equal(superNetron._stubs.size, 0);
                assert.equal(exNetron._stubs.size, 0);
            });
        });

        // describe("Multiple netrons with same NUIDs", function() {
        //     @Contextable
        //     class Worker {
        //         constructor() {
        //             this.counter = 0;
        //         }

        //         somethingUseful() {
        //             ++this.counter;
        //         }
        //     }

        //     @Contextable
        //     class Cache {
        //         constructor() {
        //             this.storage = [];
        //         }

        //         register(context) {
        //             this.storage.push(context);
        //         }

        //         async spread() {
        //             for (const context of this.storage) {
        //                 try {
        //                     await context.somethingUseful();
        //                 } catch (err) { }
        //             }
        //         }
        //     }

        //     afterEach(async function(){
        //         await superNetron.disconnect();
        //     });

        //     it("interfaces must be inaccesible", async function () {
        //         const cache = new Cache();
        //         superNetron.attachContext(cache, "cache");
        //         await superNetron.bind({ port: NETRON_PORT });

        //         for (let i = 0; i < 10; ++i) {
        //             const client = new Netron();
        //             const peer = await client.connect({ port: NETRON_PORT });
        //             const cache = peer.getInterfaceByName("cache");
        //             await cache.register(new Worker());
        //             await client.disconnect();
        //         }
        //         const client = new Netron();
        //         const peer = await client.connect({ port: NETRON_PORT });
        //         const iCache = peer.getInterfaceByName("cache");
        //         const worker = new Worker();
        //         await iCache.register(worker);
        //         await cache.spread();
        //         assert.equal(worker.counter, 1);
        //         await client.disconnect();
        //     });
        // });

        describe("critical situations", () => {
            const babel_plugins = [
                "transform.decoratorsLegacy",
                "transform.classProperties",
                "transform.ESModules",
                "transform.asyncToGenerator",
                "transform.functionBind"
            ];

            afterEach(async () => {
                await superNetron.disconnect();
            });

            it("client crash", async () => {
                await superNetron.bind();

                const code = `
                    const adone = require("../../..").default;
                    let n = new adone.netron.Netron();
                    n.connect({ port: ${DEFAULT_PORT} } )
                    .then(() => console.log("connected"))
                    .catch((error) => console.error(error));
                `;

                const child = adone.std.child_process.spawn("node", [], { stdio: "pipe", cwd: __dirname });

                child.stdin.write(code);
                child.stdin.end();

                return new Promise((resolve, reject) => {
                    superNetron.on("peer offline", (peer) => {
                        resolve();
                    });

                    child.stdout.on("data", (data) => {
                        const msg = data.toString().trim();
                        if (msg === "connected") {
                            child.kill("SIGKILL");
                        } else {
                            reject(new Error(`Unrecognized output from child: ${msg}`));
                        }
                    });

                    child.stderr.on("data", (data) => {
                        reject(new Error(`Child process error: ${data.toString().trim()}`));
                    });

                    child.on("error", (error) => {
                        reject(new Error(`Child error: ${error}`));
                    });

                    child.on("exit", (code, signal) => {
                        if (signal !== "SIGKILL") {
                            reject(new Error(`Uknown exited code (${code}) or signal (${signal})`));
                        }
                    });
                });
            });
        });

        describe.only("Gates", () => {
            @Contextable
            class A {
                method1() {
                    return "A1";
                }

                method2() {
                    return "A2";
                }
            }

            @Contextable
            class B {
                method1() {
                    return "B1";
                }

                method2() {
                    return "B2";
                }
            }

            afterEach(async () => {
                await superNetron.disconnect();
            });

            it("by default all contexts should be accessible", async () => {
                superNetron.attachContext(new A(), "a");
                superNetron.attachContext(new B(), "b");
                await superNetron.bind({
                    port: defaultPort,
                    access: {

                    }
                });

                const peer = await exNetron.connect({
                    port: defaultPort
                });

                assert.sameMembers(peer.getContextNames(), ["a", "b"]);
                const iA = peer.getInterfaceByName("a");
                const iB = peer.getInterfaceByName("b");
                assert.equal(await iA.method1(), "A1");
                assert.equal(await iB.method1(), "B1");
            });

            for (const contexts of [undefined, null, []]) {
                it(`all contextes should be accessible if context = ${contexts}`, async () => {
                    superNetron.attachContext(new A(), "a");
                    superNetron.attachContext(new B(), "b");
                    await superNetron.bind({
                        port: defaultPort,
                        access: {
                            contexts
                        }
                    });

                    const peer = await exNetron.connect({
                        port: defaultPort
                    });

                    assert.sameMembers(peer.getContextNames(), ["a", "b"]);
                    const iA = peer.getInterfaceByName("a");
                    const iB = peer.getInterfaceByName("b");
                    assert.equal(await iA.method1(), "A1");
                    assert.equal(await iB.method1(), "B1");
                });
            }

            it("should be accessable only enumerated contexts", async () => {
                superNetron.attachContext(new A(), "a");
                superNetron.attachContext(new B(), "b");
                await superNetron.bind({
                    port: defaultPort,
                    access: {
                        contexts: ["a"]
                    }
                });

                const peer = await exNetron.connect({
                    port: defaultPort
                });

                assert.sameMembers(peer.getContextNames(), ["a"]);
                const iA = peer.getInterfaceByName("a");
                assert.equal(await iA.method1(), "A1");

                try {
                    const iB = peer.getInterfaceByName("b");
                    assert.equal(await iB.method1(), "B1");
                } catch (err) {
                    assert.instanceOf(err, adone.x.Unknown);
                    return;
                }
                assert.fail("Should throw 'Unknown' exception");
            });
        });
    });
});
