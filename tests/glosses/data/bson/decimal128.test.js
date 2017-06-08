describe("data", "bson", "decimal 128", () => {
    const { data: { bson: { Decimal128 } } } = adone;

    const NAN = Buffer.from([
        0x7c, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ].reverse());
    const INF_NEGATIVE_BUFFER = Buffer.from([
        0xf8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ].reverse());
    const INF_POSITIVE_BUFFER = Buffer.from([
        0x78, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ].reverse());
    const { BSON } = adone.data.bson;


    describe("decimal128", () => {
        it("fromString invalid input", () => {
            expect(() => {
                Decimal128.fromString("E02");
            }).to.throw();
            expect(() => {
                Decimal128.fromString("E+02");
            }).to.throw();
            expect(() => {
                Decimal128.fromString("e+02");
            }).to.throw();
            expect(() => {
                Decimal128.fromString(".");
            }).to.throw();
            expect(() => {
                Decimal128.fromString(".e");
            }).to.throw();
            expect(() => {
                Decimal128.fromString("");
            }).to.throw();
            expect(() => {
                Decimal128.fromString("invalid");
            }).to.throw();
            expect(() => {
                Decimal128.fromString("in");
            }).to.throw();
            expect(() => {
                Decimal128.fromString("i");
            }).to.throw();
            expect(() => {
                Decimal128.fromString("..1");
            }).to.throw();
            expect(() => {
                Decimal128.fromString("1abcede");
            }).to.throw();
            expect(() => {
                Decimal128.fromString("1.24abc");
            }).to.throw();
            expect(() => {
                Decimal128.fromString("1.24abcE+02");
            }).to.throw();
            expect(() => {
                Decimal128.fromString("1.24E+02abc2d");
            }).to.throw();
        });

        it("fromString NaN input", () => {
            let result = Decimal128.fromString("NaN");
            expect(NAN).to.be.deep.equal(result.bytes);
            result = Decimal128.fromString("+NaN");
            expect(NAN).to.be.deep.equal(result.bytes);
            result = Decimal128.fromString("-NaN");
            expect(NAN).to.be.deep.equal(result.bytes);
            result = Decimal128.fromString("-nan");
            expect(NAN).to.be.deep.equal(result.bytes);
            result = Decimal128.fromString("1e");
            expect(NAN).to.be.deep.equal(result.bytes);
            result = Decimal128.fromString("+nan");
            expect(NAN).to.be.deep.equal(result.bytes);
            result = Decimal128.fromString("nan");
            expect(NAN).to.be.deep.equal(result.bytes);
            result = Decimal128.fromString("Nan");
            expect(NAN).to.be.deep.equal(result.bytes);
            result = Decimal128.fromString("+Nan");
            expect(NAN).to.be.deep.equal(result.bytes);
            result = Decimal128.fromString("-Nan");
            expect(NAN).to.be.deep.equal(result.bytes);
        });

        it("fromString infinity input", () => {
            let result = Decimal128.fromString("Infinity");
            expect(INF_POSITIVE_BUFFER).to.be.deep.equal(result.bytes);
            result = Decimal128.fromString("+Infinity");
            expect(INF_POSITIVE_BUFFER).to.be.deep.equal(result.bytes);
            result = Decimal128.fromString("+Inf");
            expect(INF_POSITIVE_BUFFER).to.be.deep.equal(result.bytes);
            result = Decimal128.fromString("-Inf");
            expect(INF_NEGATIVE_BUFFER).to.be.deep.equal(result.bytes);
            result = Decimal128.fromString("-Infinity");
            expect(INF_NEGATIVE_BUFFER).to.be.deep.equal(result.bytes);
        });

        it("fromString simple", () => {
            // Create decimal from string value 1
            let result = Decimal128.fromString("1");
            let bytes = new Buffer([0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);

            // Create decimal from string value 0
            result = Decimal128.fromString("0");
            bytes = new Buffer([0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);

            // Create decimal from string value -0
            result = Decimal128.fromString("-0");
            bytes = new Buffer([0xb0, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);

            // Create decimal from string value -1
            result = Decimal128.fromString("-1");
            bytes = new Buffer([0xb0, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);

            // Create decimal from string value 12345678901234567
            result = Decimal128.fromString("12345678901234567");
            bytes = new Buffer([0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x2b, 0xdc, 0x54, 0x5d, 0x6b, 0x4b, 0x87].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);

            // Create decimal from string value 989898983458
            result = Decimal128.fromString("989898983458");
            bytes = new Buffer([0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xe6, 0x7a, 0x93, 0xc8, 0x22].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);

            // Create decimal from string value -12345678901234567
            result = Decimal128.fromString("-12345678901234567");
            bytes = new Buffer([0xb0, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x2b, 0xdc, 0x54, 0x5d, 0x6b, 0x4b, 0x87].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);

            // Create decimal from string value 0.12345
            result = Decimal128.fromString("0.12345");
            bytes = new Buffer([0x30, 0x36, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x30, 0x39].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);

            // Create decimal from string value 0.0012345
            result = Decimal128.fromString("0.0012345");
            bytes = new Buffer([0x30, 0x32, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x30, 0x39].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);

            // Create decimal from string value 00012345678901234567
            result = Decimal128.fromString("00012345678901234567");
            bytes = new Buffer([0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x2b, 0xdc, 0x54, 0x5d, 0x6b, 0x4b, 0x87].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);
        });

        it("fromString scientific format", () => {
            // Create decimal from string value 10e0
            let result = Decimal128.fromString("10e0");
            let bytes = new Buffer([0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0a].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);

            // Create decimal from string value 1e1
            result = Decimal128.fromString("1e1");
            bytes = new Buffer([0x30, 0x42, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);

            // Create decimal from string value 10e-1
            result = Decimal128.fromString("10e-1");
            bytes = new Buffer([0x30, 0x3e, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0a].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);

            // Create decimal from string value 12345678901234567e6111
            result = Decimal128.fromString("12345678901234567e6111");
            bytes = new Buffer([0x5f, 0xfe, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x2b, 0xdc, 0x54, 0x5d, 0x6b, 0x4b, 0x87].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);

            // Create decimal from string value 1e-6176
            result = Decimal128.fromString("1e-6176");
            bytes = new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);

            // Create decimal from string value "-100E-10
            result = Decimal128.fromString("-100E-10");
            bytes = new Buffer([0xb0, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x64].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);

            // Create decimal from string value 10.50E8
            result = Decimal128.fromString("10.50E8");
            bytes = new Buffer([0x30, 0x4c, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x04, 0x1a].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);
        });

        it("fromString large format", () => {
            // Create decimal from string value 12345689012345789012345
            let result = Decimal128.fromString("12345689012345789012345");
            let bytes = new Buffer([0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x02, 0x9d, 0x42, 0xda, 0x3a, 0x76, 0xf9, 0xe0, 0xd9, 0x79].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);

            // Create decimal from string value 1234567890123456789012345678901234
            result = Decimal128.fromString("1234567890123456789012345678901234");
            bytes = new Buffer([0x30, 0x40, 0x3c, 0xde, 0x6f, 0xff, 0x97, 0x32, 0xde, 0x82, 0x5c, 0xd0, 0x7e, 0x96, 0xaf, 0xf2].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);

            // Create decimal from string value 9.999999999999999999999999999999999E+6144
            result = Decimal128.fromString("9.999999999999999999999999999999999E+6144");
            bytes = new Buffer([0x5f, 0xff, 0xed, 0x09, 0xbe, 0xad, 0x87, 0xc0, 0x37, 0x8d, 0x8e, 0x63, 0xff, 0xff, 0xff, 0xff].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);

            // Create decimal from string value 9.999999999999999999999999999999999E-6143
            result = Decimal128.fromString("9.999999999999999999999999999999999E-6143");
            bytes = new Buffer([0x00, 0x01, 0xed, 0x09, 0xbe, 0xad, 0x87, 0xc0, 0x37, 0x8d, 0x8e, 0x63, 0xff, 0xff, 0xff, 0xff].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);

            // Create decimal from string value 5.192296858534827628530496329220095E+33
            result = Decimal128.fromString("5.192296858534827628530496329220095E+33");
            bytes = new Buffer([0x30, 0x40, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);
        });

        it("fromString exponent normalization", () => {
            // Create decimal from string value 1000000000000000000000000000000000000000
            let result = Decimal128.fromString("1000000000000000000000000000000000000000");
            let bytes = new Buffer([0x30, 0x4c, 0x31, 0x4d, 0xc6, 0x44, 0x8d, 0x93, 0x38, 0xc1, 0x5b, 0x0a, 0x00, 0x00, 0x00, 0x00].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);

            // Create decimal from string value 10000000000000000000000000000000000
            result = Decimal128.fromString("10000000000000000000000000000000000");
            bytes = new Buffer([0x30, 0x42, 0x31, 0x4d, 0xc6, 0x44, 0x8d, 0x93, 0x38, 0xc1, 0x5b, 0x0a, 0x00, 0x00, 0x00, 0x00].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);

            // Create decimal from string value 1000000000000000000000000000000000
            result = Decimal128.fromString("1000000000000000000000000000000000");
            bytes = new Buffer([0x30, 0x40, 0x31, 0x4d, 0xc6, 0x44, 0x8d, 0x93, 0x38, 0xc1, 0x5b, 0x0a, 0x00, 0x00, 0x00, 0x00].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);

            const str = "100000000000000000000000000000000000000000000000000000000000000000000" + "000000000000000000000000000000000000000000000000000000000000000000000" + "000000000000000000000000000000000000000000000000000000000000000000000" + "000000000000000000000000000000000000000000000000000000000000000000000" + "000000000000000000000000000000000000000000000000000000000000000000000" + "000000000000000000000000000000000000000000000000000000000000000000000" + "000000000000000000000000000000000000000000000000000000000000000000000" + "000000000000000000000000000000000000000000000000000000000000000000000" + "000000000000000000000000000000000000000000000000000000000000000000000" + "000000000000000000000000000000000000000000000000000000000000000000000" + "000000000000000000000000000000000000000000000000000000000000000000000" + "000000000000000000000000000000000000000000000000000000000000000000000" + "000000000000000000000000000000000000000000000000000000000000000000000" + "000000000000000000000000000000000000000000000000000000000000000000000" + "0000000000000000000000000000000000";

            // Create decimal from string value str
            result = Decimal128.fromString(str);
            bytes = new Buffer([0x37, 0xcc, 0x31, 0x4d, 0xc6, 0x44, 0x8d, 0x93, 0x38, 0xc1, 0x5b, 0x0a, 0x00, 0x00, 0x00, 0x00].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);

            // Create decimal from string value 1E-6177
            result = Decimal128.fromString("1E-6177");
            bytes = new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);
        });

        it("fromString from string zeros", () => {
            // Create decimal from string value 0
            let result = Decimal128.fromString("0");
            let bytes = new Buffer([0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);

            // Create decimal from string value 0e-611
            result = Decimal128.fromString("0e-611");
            bytes = new Buffer([0x2b, 0x7a, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);

            // Create decimal from string value 0e+6000
            result = Decimal128.fromString("0e+6000");
            bytes = new Buffer([0x5f, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);

            // Create decimal from string value 1E-6177
            result = Decimal128.fromString("-0e-1");
            bytes = new Buffer([0xb0, 0x3e, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);
        });

        it("fromString from string round", () => {
            // Create decimal from string value 10E-6177
            let result = Decimal128.fromString("10E-6177");
            let bytes = new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);

            // Create decimal from string value 15E-6177
            result = Decimal128.fromString("15E-6177");
            bytes = new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);

            result = Decimal128.fromString("251E-6178");
            bytes = new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);

            // Create decimal from string value 250E-6178
            result = Decimal128.fromString("250E-6178");
            bytes = new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);

            // Create decimal from string value 10000000000000000000000000000000006
            result = Decimal128.fromString("10000000000000000000000000000000006");
            bytes = new Buffer([0x30, 0x42, 0x31, 0x4d, 0xc6, 0x44, 0x8d, 0x93, 0x38, 0xc1, 0x5b, 0x0a, 0x00, 0x00, 0x00, 0x01].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);

            // Create decimal from string value 10000000000000000000000000000000003
            result = Decimal128.fromString("10000000000000000000000000000000003");
            bytes = new Buffer([0x30, 0x42, 0x31, 0x4d, 0xc6, 0x44, 0x8d, 0x93, 0x38, 0xc1, 0x5b, 0x0a, 0x00, 0x00, 0x00, 0x00].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);

            // Create decimal from string value 10000000000000000000000000000000005
            result = Decimal128.fromString("10000000000000000000000000000000005");
            bytes = new Buffer([0x30, 0x42, 0x31, 0x4d, 0xc6, 0x44, 0x8d, 0x93, 0x38, 0xc1, 0x5b, 0x0a, 0x00, 0x00, 0x00, 0x00].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);

            // Create decimal from string value 100000000000000000000000000000000051
            result = Decimal128.fromString("100000000000000000000000000000000051");
            bytes = new Buffer([0x30, 0x44, 0x31, 0x4d, 0xc6, 0x44, 0x8d, 0x93, 0x38, 0xc1, 0x5b, 0x0a, 0x00, 0x00, 0x00, 0x01].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);

            // Create decimal from string value 10000000000000000000000000000000006E6111
            result = Decimal128.fromString("10000000000000000000000000000000006E6111");
            bytes = new Buffer([0x78, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);

            // Create decimal from string value 12980742146337069071326240823050239
            result = Decimal128.fromString("12980742146337069071326240823050239");
            bytes = new Buffer([0x30, 0x42, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);

            // Create decimal from string value 99999999999999999999999999999999999
            result = Decimal128.fromString("99999999999999999999999999999999999");
            bytes = new Buffer([0x30, 0x44, 0x31, 0x4d, 0xc6, 0x44, 0x8d, 0x93, 0x38, 0xc1, 0x5b, 0x0a, 0x00, 0x00, 0x00, 0x00].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);

            // Create decimal from string value 9999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999
            result = Decimal128.fromString("9999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999");
            bytes = new Buffer([0x30, 0xc6, 0x31, 0x4d, 0xc6, 0x44, 0x8d, 0x93, 0x38, 0xc1, 0x5b, 0x0a, 0x00, 0x00, 0x00, 0x00].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);

            // Create decimal from string value 9999999999999999999999999999999999E6111
            result = Decimal128.fromString("9999999999999999999999999999999999E6111");
            bytes = new Buffer([0x5f, 0xff, 0xed, 0x09, 0xbe, 0xad, 0x87, 0xc0, 0x37, 0x8d, 0x8e, 0x63, 0xff, 0xff, 0xff, 0xff].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);

            // Create decimal from string value 99999999999999999999999999999999999E6144
            result = Decimal128.fromString("99999999999999999999999999999999999E6144");
            bytes = new Buffer([0x78, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse());
            expect(bytes).to.be.deep.equal(result.bytes);
        });

        it("toString infinity", () => {
            let decimal = new Decimal128(new Buffer([0x78, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse()));
            expect("Infinity").to.be.equal(decimal.toString());

            decimal = new Decimal128(new Buffer([0xf8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse()));
            expect("-Infinity").to.be.equal(decimal.toString());
        });

        it("toString NaN", () => {
            let decimal = new Decimal128(new Buffer([0x7c, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse()));
            expect("NaN").to.be.equal(decimal.toString());

            decimal = new Decimal128(new Buffer([0xfc, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse()));
            expect("NaN").to.be.equal(decimal.toString());

            decimal = new Decimal128(new Buffer([0x7e, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse()));
            expect("NaN").to.be.equal(decimal.toString());

            decimal = new Decimal128(new Buffer([0xfe, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse()));
            expect("NaN").to.be.equal(decimal.toString());

            decimal = new Decimal128(new Buffer([0x7e, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x12].reverse()));
            expect("NaN").to.be.equal(decimal.toString());
        });

        it("toString regular", () => {
            let decimal = new Decimal128(new Buffer([0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01].reverse()));
            expect("1").to.be.equal(decimal.toString());

            decimal = new Decimal128(new Buffer([0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse()));
            expect("0").to.be.equal(decimal.toString());

            decimal = new Decimal128(new Buffer([0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02].reverse()));
            expect("2").to.be.equal(decimal.toString());

            decimal = new Decimal128(new Buffer([0xb0, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01].reverse()));
            expect("-1").to.be.equal(decimal.toString());

            decimal = new Decimal128(new Buffer([0xb0, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse()));
            expect("-0").to.be.equal(decimal.toString());

            decimal = new Decimal128(new Buffer([0x30, 0x3e, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01].reverse()));
            expect("0.1").to.be.equal(decimal.toString());

            decimal = new Decimal128(new Buffer([0x30, 0x34, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x04, 0xd2].reverse()));
            expect("0.001234").to.be.equal(decimal.toString());

            decimal = new Decimal128(new Buffer([0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x1c, 0xbe, 0x99, 0x1a, 0x14].reverse()));
            expect("123456789012").to.be.equal(decimal.toString());

            decimal = new Decimal128(new Buffer([0x30, 0x2a, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x07, 0x5a, 0xef, 0x40].reverse()));
            expect("0.00123400000").to.be.equal(decimal.toString());

            decimal = new Decimal128(new Buffer([0x2f, 0xfc, 0x3c, 0xde, 0x6f, 0xff, 0x97, 0x32, 0xde, 0x82, 0x5c, 0xd0, 0x7e, 0x96, 0xaf, 0xf2].reverse()));
            expect("0.1234567890123456789012345678901234").to.be.equal(decimal.toString());
        });

        it("toString scientific", () => {
            let decimal = new Decimal128(new Buffer([0x5f, 0xfe, 0x31, 0x4d, 0xc6, 0x44, 0x8d, 0x93, 0x38, 0xc1, 0x5b, 0x0a, 0x00, 0x00, 0x00, 0x00].reverse()));
            expect("1.000000000000000000000000000000000E+6144").to.be.equal(decimal.toString());

            decimal = new Decimal128(new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01].reverse()));
            expect("1E-6176").to.be.equal(decimal.toString());

            decimal = new Decimal128(new Buffer([0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01].reverse()));
            expect("-1E-6176").to.be.equal(decimal.toString());

            decimal = new Decimal128(new Buffer([0x31, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x09, 0x18, 0x4d, 0xb6, 0x3e, 0xb1].reverse()));
            expect("9.999987654321E+112").to.be.equal(decimal.toString());

            decimal = new Decimal128(new Buffer([0x5f, 0xff, 0xed, 0x09, 0xbe, 0xad, 0x87, 0xc0, 0x37, 0x8d, 0x8e, 0x63, 0xff, 0xff, 0xff, 0xff].reverse()));
            expect("9.999999999999999999999999999999999E+6144").to.be.equal(decimal.toString());

            decimal = new Decimal128(new Buffer([0x00, 0x01, 0xed, 0x09, 0xbe, 0xad, 0x87, 0xc0, 0x37, 0x8d, 0x8e, 0x63, 0xff, 0xff, 0xff, 0xff].reverse()));
            expect("9.999999999999999999999999999999999E-6143").to.be.equal(decimal.toString());

            decimal = new Decimal128(new Buffer([0x30, 0x40, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff].reverse()));
            expect("5192296858534827628530496329220095").to.be.equal(decimal.toString());

            decimal = new Decimal128(new Buffer([0x30, 0x4c, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x04, 0x1a].reverse()));
            expect("1.050E+9").to.be.equal(decimal.toString());

            decimal = new Decimal128(new Buffer([0x30, 0x42, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x04, 0x1a].reverse()));
            expect("1.050E+4").to.be.equal(decimal.toString());

            decimal = new Decimal128(new Buffer([0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x69].reverse()));
            expect("105").to.be.equal(decimal.toString());

            decimal = new Decimal128(new Buffer([0x30, 0x42, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x69].reverse()));
            expect("1.05E+3").to.be.equal(decimal.toString());

            decimal = new Decimal128(new Buffer([0x30, 0x46, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01].reverse()));
            expect("1E+3").to.be.equal(decimal.toString());
        });

        it("toString zeros", () => {
            let decimal = new Decimal128(new Buffer([0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse()));
            expect("0").to.be.equal(decimal.toString());

            decimal = new Decimal128(new Buffer([0x32, 0x98, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse()));
            expect("0E+300").to.be.equal(decimal.toString());

            decimal = new Decimal128(new Buffer([0x2b, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse()));
            expect("0E-600").to.be.equal(decimal.toString());
        });

        it("serialize and deserialize tests", () => {
            const bson = new BSON();

            // Test all methods around a simple serialization at object top level
            let doc = { value: Decimal128.fromString("1") };
            let buffer = bson.serialize(doc);
            let size = bson.calculateObjectSize(doc);
            let back = bson.deserialize(buffer);

            expect(buffer.length).to.be.equal(size);
            expect(doc).to.be.deep.equal(back);
            expect("1").to.be.equal(doc.value.toString());
            expect("{\"value\":{\"$numberDecimal\":\"1\"}}").to.be.equal(JSON.stringify(doc, null));

            // Test all methods around a simple serialization at array top level
            doc = { value: [Decimal128.fromString("1")] };
            buffer = bson.serialize(doc);
            size = bson.calculateObjectSize(doc);
            back = bson.deserialize(buffer);

            expect(buffer.length).to.be.equal(size);
            expect(doc).to.be.deep.equal(back);
            expect("1").to.be.equal(doc.value[0].toString());

            // Test all methods around a simple serialization at nested object
            doc = { value: { a: Decimal128.fromString("1") } };
            buffer = bson.serialize(doc);
            size = bson.calculateObjectSize(doc);
            back = bson.deserialize(buffer);

            expect(buffer.length).to.be.equal(size);
            expect(doc).to.be.deep.equal(back);
            expect("1").to.be.equal(doc.value.a.toString());
        });

        it("Support toBSON and toObject methods for custom mapping", () => {
            const bson = new BSON();

            // Create a custom object
            const MyCustomDecimal = function (value) {
                this.value = value instanceof Decimal128 ? value.toString() : value;
            };

            MyCustomDecimal.prototype.toBSON = function () {
                return Decimal128.fromString(this.value);
            };

            // Add a custom mapper for the type
            Decimal128.prototype.toObject = function () {
                return new MyCustomDecimal(this);
            };

            // Test all methods around a simple serialization at object top level
            const doc = { value: new MyCustomDecimal("1") };
            const buffer = bson.serialize(doc);
            const back = bson.deserialize(buffer);
            expect(back.value instanceof MyCustomDecimal).to.be.ok;
            expect("1").to.be.equal(back.value.value);
        });
    });
});
