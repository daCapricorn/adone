const {
    is,
    terminal: { gradient: { Color } }
} = adone;

describe("terminal", "gradient", "Color", () => {
    // Taken from convertWikipediaColors.html
    const conversions = [
        { hex: "#FFFFFF", hex8: "#FFFFFFFF", rgb: { r: "100.0%", g: "100.0%", b: "100.0%" }, hsv: { h: "0", s: "0.000", v: "1.000" }, hsl: { h: "0", s: "0.000", l: "1.000" } },
        { hex: "#808080", hex8: "#808080FF", rgb: { r: "050.0%", g: "050.0%", b: "050.0%" }, hsv: { h: "0", s: "0.000", v: "0.500" }, hsl: { h: "0", s: "0.000", l: "0.500" } },
        { hex: "#000000", hex8: "#000000FF", rgb: { r: "000.0%", g: "000.0%", b: "000.0%" }, hsv: { h: "0", s: "0.000", v: "0.000" }, hsl: { h: "0", s: "0.000", l: "0.000" } },
        { hex: "#FF0000", hex8: "#FF0000FF", rgb: { r: "100.0%", g: "000.0%", b: "000.0%" }, hsv: { h: "0.0", s: "1.000", v: "1.000" }, hsl: { h: "0.0", s: "1.000", l: "0.500" } },
        { hex: "#BFBF00", hex8: "#BFBF00FF", rgb: { r: "075.0%", g: "075.0%", b: "000.0%" }, hsv: { h: "60.0", s: "1.000", v: "0.750" }, hsl: { h: "60.0", s: "1.000", l: "0.375" } },
        { hex: "#008000", hex8: "#008000FF", rgb: { r: "000.0%", g: "050.0%", b: "000.0%" }, hsv: { h: "120.0", s: "1.000", v: "0.500" }, hsl: { h: "120.0", s: "1.000", l: "0.250" } },
        { hex: "#80FFFF", hex8: "#80FFFFFF", rgb: { r: "050.0%", g: "100.0%", b: "100.0%" }, hsv: { h: "180.0", s: "0.500", v: "1.000" }, hsl: { h: "180.0", s: "1.000", l: "0.750" } },
        { hex: "#8080FF", hex8: "#8080FFFF", rgb: { r: "050.0%", g: "050.0%", b: "100.0%" }, hsv: { h: "240.0", s: "0.500", v: "1.000" }, hsl: { h: "240.0", s: "1.000", l: "0.750" } },
        { hex: "#BF40BF", hex8: "#BF40BFFF", rgb: { r: "075.0%", g: "025.0%", b: "075.0%" }, hsv: { h: "300.0", s: "0.667", v: "0.750" }, hsl: { h: "300.0", s: "0.500", l: "0.500" } },
        { hex: "#A0A424", hex8: "#A0A424FF", rgb: { r: "062.8%", g: "064.3%", b: "014.2%" }, hsv: { h: "61.8", s: "0.779", v: "0.643" }, hsl: { h: "61.8", s: "0.638", l: "0.393" } },
        { hex: "#1EAC41", hex8: "#1EAC41FF", rgb: { r: "011.6%", g: "067.5%", b: "025.5%" }, hsv: { h: "134.9", s: "0.828", v: "0.675" }, hsl: { h: "134.9", s: "0.707", l: "0.396" } },
        { hex: "#B430E5", hex8: "#B430E5FF", rgb: { r: "070.4%", g: "018.7%", b: "089.7%" }, hsv: { h: "283.7", s: "0.792", v: "0.897" }, hsl: { h: "283.7", s: "0.775", l: "0.542" } },
        { hex: "#FEF888", hex8: "#FEF888FF", rgb: { r: "099.8%", g: "097.4%", b: "053.2%" }, hsv: { h: "56.9", s: "0.467", v: "0.998" }, hsl: { h: "56.9", s: "0.991", l: "0.765" } },
        { hex: "#19CB97", hex8: "#19CB97FF", rgb: { r: "009.9%", g: "079.5%", b: "059.1%" }, hsv: { h: "162.4", s: "0.875", v: "0.795" }, hsl: { h: "162.4", s: "0.779", l: "0.447" } },
        { hex: "#362698", hex8: "#362698FF", rgb: { r: "021.1%", g: "014.9%", b: "059.7%" }, hsv: { h: "248.3", s: "0.750", v: "0.597" }, hsl: { h: "248.3", s: "0.601", l: "0.373" } },
        { hex: "#7E7EB8", hex8: "#7E7EB8FF", rgb: { r: "049.5%", g: "049.3%", b: "072.1%" }, hsv: { h: "240.5", s: "0.316", v: "0.721" }, hsl: { h: "240.5", s: "0.290", l: "0.607" } }
    ];

    it("Initialization", () => {
        assert.equal(new Color("red", { format: "hex" }).toString(), "#ff0000", "tinycolor options are being parsed");
        assert.equal(Color.fromRatio({ r: 1, g: 0, b: 0 }, { format: "hex" }).toString(), "#ff0000", "tinycolor options are being parsed");

        const obj = { h: 180, s: 0.5, l: 0.5 };
        const color = new Color(obj);
        assert.true(obj.s === 0.5, "when given an object, the original object is not modified");
    });

    it("Original input", () => {
        const colorRgbUp = "RGB(39, 39, 39)";
        const colorRgbLow = "rgb(39, 39, 39)";
        const colorRgbMix = "RgB(39, 39, 39)";
        // const tinycolorObj = new Color(colorRgbMix);
        const inputObj = { r: 100, g: 100, b: 100 };
        // const r = new Color("red");

        assert.true(new Color(colorRgbLow).getOriginalInput() === colorRgbLow, "original lowercase input is returned");
        assert.true(new Color(colorRgbUp).getOriginalInput() === colorRgbUp, "original uppercase input is returned");
        assert.true(new Color(colorRgbMix).getOriginalInput() === colorRgbMix, "original mixed input is returned");
        // assert.true(new Color(tinycolorObj).getOriginalInput() === colorRgbMix, "when given a tinycolor instance, the color string is returned");
        assert.true(new Color(inputObj).getOriginalInput() === inputObj, "when given an object, the object is returned");
        assert.true(new Color("").getOriginalInput() === "", "when given an empty string, an empty string is returned");
        assert.true(new Color(null).getOriginalInput() === "", "when given a null value, an empty string is returned");
    });

    it("Cloning color", () => {
        const originalColor = new Color("red");
        const originalColorRgbString = originalColor.toRgbString();

        const clonedColor = originalColor.clone();
        assert.true(clonedColor.toRgbString() === originalColor.toRgbString(), "cloned color is identical");

        clonedColor.setAlpha(0.5);
        assert.true(clonedColor.toRgbString() !== originalColor.toRgbString(), "cloned color is changing independently from original color");
        assert.true(originalColorRgbString === originalColor.toRgbString(), "original color was not changed by cloned color change");
    });


    describe("Color translations", () => {
        it("Color Equality", () => {
            for (let i = 0; i < conversions.length; i++) {
                const c = conversions[i];
                const tiny = new Color(c.hex);

                assert.true(true, tiny.isValid());
                assert.true(true,
                    `Testing ${c.hex}: ${tiny.toRgbString()} ${tiny.toPercentageRgbString()} ${tiny.toHsvString()} ${tiny.toHslString()} ${tiny.toHexString()
                    }Original: ${JSON.stringify(c.rgb)} ${JSON.stringify(c.hsv)} ${JSON.stringify(c.hsl)}`
                );
                assert.true(Color.equals(c.rgb, c.hex), `RGB equals hex ${c.hex}`);
                assert.true(Color.equals(c.rgb, c.hex8), `RGB equals hex ${c.hex}`);
                assert.true(Color.equals(c.rgb, c.hsl), `RGB equals HSL ${c.hex}`);
                assert.true(Color.equals(c.rgb, c.hsv), `RGB equals HSV ${c.hex}`);
                assert.true(Color.equals(c.rgb, c.rgb), `RGB equals RGB ${c.hex}`);

                assert.true(Color.equals(c.hex, c.hex), `hex equals hex ${c.hex}`);
                assert.true(Color.equals(c.hex, c.hex8), `hex equals hex8 ${c.hex}`);
                assert.true(Color.equals(c.hex, c.hsl), `hex equals HSL ${c.hex}`);
                assert.true(Color.equals(c.hex, c.hsv), `hex equals HSV ${c.hex}`);

                assert.true(Color.equals(c.hsl, c.hsv), `HSL equals HSV ${c.hex}`);
            }
        });
    });

    describe("Ratio Parsing", () => {
        it("With Ratio", () => {
            assert.equal(Color.fromRatio({ r: 1, g: 1, b: 1 }).toHexString(), "#ffffff", "white");
            assert.equal(Color.fromRatio({ r: 1, g: 0, b: 0, a: 0.5 }).toRgbString(), "rgba(255, 0, 0, 0.5)", "alpha works when ratio is parsed");
            assert.equal(Color.fromRatio({ r: 1, g: 0, b: 0, a: 1 }).toRgbString(), "rgb(255, 0, 0)", "alpha = 1 works when ratio is parsed");
            assert.equal(Color.fromRatio({ r: 1, g: 0, b: 0, a: 10 }).toRgbString(), "rgb(255, 0, 0)", "alpha > 1 works when ratio is parsed");
            assert.equal(Color.fromRatio({ r: 1, g: 0, b: 0, a: -1 }).toRgbString(), "rgb(255, 0, 0)", "alpha < 1 works when ratio is parsed");
        });

        it("Without Ratio", () => {
            assert.equal(new Color({ r: 1, g: 1, b: 1 }).toHexString(), "#010101", "010101");
            assert.equal(new Color({ r: 0.1, g: 0.1, b: 0.1 }).toHexString(), "#000000", "000000");
            assert.equal(new Color("rgb .1 .1 .1").toHexString(), "#000000", "000000");
        });
    });

    describe("String Parsing", () => {
        it("RGB Text Parsing", () => {
            assert.equal(new Color("rgb 255 0 0").toHexString(), "#ff0000", "spaced input");
            assert.equal(new Color("rgb(255, 0, 0)").toHexString(), "#ff0000", "parenthesized input");
            assert.equal(new Color("rgb (255, 0, 0)").toHexString(), "#ff0000", "parenthesized spaced input");
            assert.equal(new Color({ r: 255, g: 0, b: 0 }).toHexString(), "#ff0000", "object input");
            assert.deepEqual(new Color({ r: 255, g: 0, b: 0 }).toRgb(), { r: 255, g: 0, b: 0, a: 1 }, "object input and compare");

            assert.true(Color.equals({ r: 200, g: 100, b: 0 }, "rgb(200, 100, 0)"));
            assert.true(Color.equals({ r: 200, g: 100, b: 0 }, "rgb 200 100 0"));
            assert.true(Color.equals({ r: 200, g: 100, b: 0 }, "rgb 200 100 0"));
            assert.true(Color.equals({ r: 200, g: 100, b: 0, a: 0.4 }, "rgba 200 100 0 .4"));
            assert.true(!Color.equals({ r: 199, g: 100, b: 0 }, "rgba 200 100 0 1"));

            assert.true(!Color.equals({ r: 199, g: 100, b: 0 }, "rgb(200, 100, 0)"));
            assert.true(!Color.equals({ r: 199, g: 100, b: 0 }, "rgb 200 100 0"));
            assert.true(!Color.equals({ r: 199, g: 100, b: 0 }, "rgb 200 100 0"));

            assert.true(Color.equals(new Color({ r: 200, g: 100, b: 0 }), "rgb(200, 100, 0)"));
            assert.true(Color.equals(new Color({ r: 200, g: 100, b: 0 }), "rgb 200 100 0"));
            assert.true(Color.equals(new Color({ r: 200, g: 100, b: 0 }), "rgb 200 100 0"));
        });

        it("Percentage RGB Text Parsing", () => {
            assert.equal(new Color("rgb 100% 0% 0%").toHexString(), "#ff0000", "spaced input");
            assert.equal(new Color("rgb(100%, 0%, 0%)").toHexString(), "#ff0000", "parenthesized input");
            assert.equal(new Color("rgb (100%, 0%, 0%)").toHexString(), "#ff0000", "parenthesized spaced input");
            assert.equal(new Color({ r: "100%", g: "0%", b: "0%" }).toHexString(), "#ff0000", "object input");
            assert.deepEqual(new Color({ r: "100%", g: "0%", b: "0%" }).toRgb(), { r: 255, g: 0, b: 0, a: 1 }, "object input and compare");


            assert.true(Color.equals({ r: "90%", g: "45%", b: "0%" }, "rgb(90%, 45%, 0%)"));
            assert.true(Color.equals({ r: "90%", g: "45%", b: "0%" }, "rgb 90% 45% 0%"));
            assert.true(Color.equals({ r: "90%", g: "45%", b: "0%" }, "rgb 90% 45% 0%"));
            assert.true(Color.equals({ r: "90%", g: "45%", b: "0%", a: 0.4 }, "rgba 90% 45% 0% .4"));
            assert.true(!Color.equals({ r: "89%", g: "45%", b: "0%" }, "rgba 90% 45% 0% 1"));

            assert.true(!Color.equals({ r: "89%", g: "45%", b: "0%" }, "rgb(90%, 45%, 0%)"));
            assert.true(!Color.equals({ r: "89%", g: "45%", b: "0%" }, "rgb 90% 45% 0%"));
            assert.true(!Color.equals({ r: "89%", g: "45%", b: "0%" }, "rgb 90% 45% 0%"));


            assert.true(Color.equals(new Color({ r: "90%", g: "45%", b: "0%" }), "rgb(90%, 45%, 0%)"));
            assert.true(Color.equals(new Color({ r: "90%", g: "45%", b: "0%" }), "rgb 90% 45% 0%"));
            assert.true(Color.equals(new Color({ r: "90%", g: "45%", b: "0%" }), "rgb 90% 45% 0%"));
        });

        it("HSL parsing", () => {
            assert.equal(new Color({ h: 251, s: 100, l: 0.38 }).toHexString(), "#2400c2", "to hex");
            assert.equal(new Color({ h: 251, s: 100, l: 0.38 }).toRgbString(), "rgb(36, 0, 194)", "to rgb");
            assert.equal(new Color({ h: 251, s: 100, l: 0.38 }).toHslString(), "hsl(251, 100%, 38%)", "to hsl");
            assert.equal(new Color("hsl(251, 100, 38)").toHexString(), "#2400c2", "to hex");
            assert.equal(new Color("hsl(251, 100%, 38%)").toRgbString(), "rgb(36, 0, 194)", "to rgb");
            assert.equal(new Color("hsl(251, 100%, 38%)").toHslString(), "hsl(251, 100%, 38%)", "to hsl");
            assert.equal(new Color("hsl 100 20 10").toHslString(), "hsl(100, 20%, 10%)", "problematic hsl");
        });

        it("Hex Parsing", () => {
            assert.equal(new Color("rgb 255 0 0").toHexString(), "#ff0000");
            assert.equal(new Color("rgb 255 0 0").toHexString(true), "#f00");

            assert.equal(new Color("rgba 255 0 0 0.5").toHex8String(), "#ff000080");
            assert.equal(new Color("rgba 255 0 0 0").toHex8String(), "#ff000000");
            assert.equal(new Color("rgba 255 0 0 1").toHex8String(), "#ff0000ff");
            assert.equal(new Color("rgba 255 0 0 1").toHex8String(true), "#f00f");

            assert.equal(new Color("rgb 255 0 0").toHex(), "ff0000");
            assert.equal(new Color("rgb 255 0 0").toHex(true), "f00");
            assert.equal(new Color("rgba 255 0 0 0.5").toHex8(), "ff000080");
        });

        it("HSV Parsing", () => {
            assert.equal(new Color("hsv 251.1 0.887 .918").toHsvString(), "hsv(251, 89%, 92%)");
            assert.equal(new Color("hsv 251.1 0.887 0.918").toHsvString(), "hsv(251, 89%, 92%)");
            assert.equal(new Color("hsva 251.1 0.887 0.918 0.5").toHsvString(), "hsva(251, 89%, 92%, 0.5)");
        });

        it("Invalid Parsing", () => {
            let invalidColor = new Color("this is not a color");
            assert.equal(invalidColor.toHexString(), "#000000");
            assert.equal(false, invalidColor.isValid());

            invalidColor = new Color("#red");
            assert.equal(invalidColor.toHexString(), "#000000");
            assert.equal(false, invalidColor.isValid());

            invalidColor = new Color("  #red");
            assert.equal(invalidColor.toHexString(), "#000000");
            assert.equal(false, invalidColor.isValid());

            invalidColor = new Color("##123456");
            assert.equal(invalidColor.toHexString(), "#000000");
            assert.equal(false, invalidColor.isValid());

            invalidColor = new Color("  ##123456");
            assert.equal(invalidColor.toHexString(), "#000000");
            assert.equal(false, invalidColor.isValid());

            invalidColor = new Color({ r: "invalid", g: "invalid", b: "invalid" });
            assert.equal(invalidColor.toHexString(), "#000000");
            assert.equal(false, invalidColor.isValid());

            invalidColor = new Color({ h: "invalid", s: "invalid", l: "invalid" });
            assert.equal(invalidColor.toHexString(), "#000000");
            assert.equal(false, invalidColor.isValid());

            invalidColor = new Color({ h: "invalid", s: "invalid", v: "invalid" });
            assert.equal(invalidColor.toHexString(), "#000000");
            assert.equal(false, invalidColor.isValid());
        });

        it("Named colors", () => {
            assert.equal(new Color("aliceblue").toHex(), "f0f8ff");
            assert.equal(new Color("antiquewhite").toHex(), "faebd7");
            assert.equal(new Color("aqua").toHex(), "00ffff");
            assert.equal(new Color("aquamarine").toHex(), "7fffd4");
            assert.equal(new Color("azure").toHex(), "f0ffff");
            assert.equal(new Color("beige").toHex(), "f5f5dc");
            assert.equal(new Color("bisque").toHex(), "ffe4c4");
            assert.equal(new Color("black").toHex(), "000000");
            assert.equal(new Color("blanchedalmond").toHex(), "ffebcd");
            assert.equal(new Color("blue").toHex(), "0000ff");
            assert.equal(new Color("blueviolet").toHex(), "8a2be2");
            assert.equal(new Color("brown").toHex(), "a52a2a");
            assert.equal(new Color("burlywood").toHex(), "deb887");
            assert.equal(new Color("cadetblue").toHex(), "5f9ea0");
            assert.equal(new Color("chartreuse").toHex(), "7fff00");
            assert.equal(new Color("chocolate").toHex(), "d2691e");
            assert.equal(new Color("coral").toHex(), "ff7f50");
            assert.equal(new Color("cornflowerblue").toHex(), "6495ed");
            assert.equal(new Color("cornsilk").toHex(), "fff8dc");
            assert.equal(new Color("crimson").toHex(), "dc143c");
            assert.equal(new Color("cyan").toHex(), "00ffff");
            assert.equal(new Color("darkblue").toHex(), "00008b");
            assert.equal(new Color("darkcyan").toHex(), "008b8b");
            assert.equal(new Color("darkgoldenrod").toHex(), "b8860b");
            assert.equal(new Color("darkgray").toHex(), "a9a9a9");
            assert.equal(new Color("darkgreen").toHex(), "006400");
            assert.equal(new Color("darkkhaki").toHex(), "bdb76b");
            assert.equal(new Color("darkmagenta").toHex(), "8b008b");
            assert.equal(new Color("darkolivegreen").toHex(), "556b2f");
            assert.equal(new Color("darkorange").toHex(), "ff8c00");
            assert.equal(new Color("darkorchid").toHex(), "9932cc");
            assert.equal(new Color("darkred").toHex(), "8b0000");
            assert.equal(new Color("darksalmon").toHex(), "e9967a");
            assert.equal(new Color("darkseagreen").toHex(), "8fbc8f");
            assert.equal(new Color("darkslateblue").toHex(), "483d8b");
            assert.equal(new Color("darkslategray").toHex(), "2f4f4f");
            assert.equal(new Color("darkturquoise").toHex(), "00ced1");
            assert.equal(new Color("darkviolet").toHex(), "9400d3");
            assert.equal(new Color("deeppink").toHex(), "ff1493");
            assert.equal(new Color("deepskyblue").toHex(), "00bfff");
            assert.equal(new Color("dimgray").toHex(), "696969");
            assert.equal(new Color("dodgerblue").toHex(), "1e90ff");
            assert.equal(new Color("firebrick").toHex(), "b22222");
            assert.equal(new Color("floralwhite").toHex(), "fffaf0");
            assert.equal(new Color("forestgreen").toHex(), "228b22");
            assert.equal(new Color("fuchsia").toHex(), "ff00ff");
            assert.equal(new Color("gainsboro").toHex(), "dcdcdc");
            assert.equal(new Color("ghostwhite").toHex(), "f8f8ff");
            assert.equal(new Color("gold").toHex(), "ffd700");
            assert.equal(new Color("goldenrod").toHex(), "daa520");
            assert.equal(new Color("gray").toHex(), "808080");
            assert.equal(new Color("grey").toHex(), "808080");
            assert.equal(new Color("green").toHex(), "008000");
            assert.equal(new Color("greenyellow").toHex(), "adff2f");
            assert.equal(new Color("honeydew").toHex(), "f0fff0");
            assert.equal(new Color("hotpink").toHex(), "ff69b4");
            assert.equal(new Color("indianred ").toHex(), "cd5c5c");
            assert.equal(new Color("indigo ").toHex(), "4b0082");
            assert.equal(new Color("ivory").toHex(), "fffff0");
            assert.equal(new Color("khaki").toHex(), "f0e68c");
            assert.equal(new Color("lavender").toHex(), "e6e6fa");
            assert.equal(new Color("lavenderblush").toHex(), "fff0f5");
            assert.equal(new Color("lawngreen").toHex(), "7cfc00");
            assert.equal(new Color("lemonchiffon").toHex(), "fffacd");
            assert.equal(new Color("lightblue").toHex(), "add8e6");
            assert.equal(new Color("lightcoral").toHex(), "f08080");
            assert.equal(new Color("lightcyan").toHex(), "e0ffff");
            assert.equal(new Color("lightgoldenrodyellow").toHex(), "fafad2");
            assert.equal(new Color("lightgrey").toHex(), "d3d3d3");
            assert.equal(new Color("lightgreen").toHex(), "90ee90");
            assert.equal(new Color("lightpink").toHex(), "ffb6c1");
            assert.equal(new Color("lightsalmon").toHex(), "ffa07a");
            assert.equal(new Color("lightseagreen").toHex(), "20b2aa");
            assert.equal(new Color("lightskyblue").toHex(), "87cefa");
            assert.equal(new Color("lightslategray").toHex(), "778899");
            assert.equal(new Color("lightsteelblue").toHex(), "b0c4de");
            assert.equal(new Color("lightyellow").toHex(), "ffffe0");
            assert.equal(new Color("lime").toHex(), "00ff00");
            assert.equal(new Color("limegreen").toHex(), "32cd32");
            assert.equal(new Color("linen").toHex(), "faf0e6");
            assert.equal(new Color("magenta").toHex(), "ff00ff");
            assert.equal(new Color("maroon").toHex(), "800000");
            assert.equal(new Color("mediumaquamarine").toHex(), "66cdaa");
            assert.equal(new Color("mediumblue").toHex(), "0000cd");
            assert.equal(new Color("mediumorchid").toHex(), "ba55d3");
            assert.equal(new Color("mediumpurple").toHex(), "9370db");
            assert.equal(new Color("mediumseagreen").toHex(), "3cb371");
            assert.equal(new Color("mediumslateblue").toHex(), "7b68ee");
            assert.equal(new Color("mediumspringgreen").toHex(), "00fa9a");
            assert.equal(new Color("mediumturquoise").toHex(), "48d1cc");
            assert.equal(new Color("mediumvioletred").toHex(), "c71585");
            assert.equal(new Color("midnightblue").toHex(), "191970");
            assert.equal(new Color("mintcream").toHex(), "f5fffa");
            assert.equal(new Color("mistyrose").toHex(), "ffe4e1");
            assert.equal(new Color("moccasin").toHex(), "ffe4b5");
            assert.equal(new Color("navajowhite").toHex(), "ffdead");
            assert.equal(new Color("navy").toHex(), "000080");
            assert.equal(new Color("oldlace").toHex(), "fdf5e6");
            assert.equal(new Color("olive").toHex(), "808000");
            assert.equal(new Color("olivedrab").toHex(), "6b8e23");
            assert.equal(new Color("orange").toHex(), "ffa500");
            assert.equal(new Color("orangered").toHex(), "ff4500");
            assert.equal(new Color("orchid").toHex(), "da70d6");
            assert.equal(new Color("palegoldenrod").toHex(), "eee8aa");
            assert.equal(new Color("palegreen").toHex(), "98fb98");
            assert.equal(new Color("paleturquoise").toHex(), "afeeee");
            assert.equal(new Color("palevioletred").toHex(), "db7093");
            assert.equal(new Color("papayawhip").toHex(), "ffefd5");
            assert.equal(new Color("peachpuff").toHex(), "ffdab9");
            assert.equal(new Color("peru").toHex(), "cd853f");
            assert.equal(new Color("pink").toHex(), "ffc0cb");
            assert.equal(new Color("plum").toHex(), "dda0dd");
            assert.equal(new Color("powderblue").toHex(), "b0e0e6");
            assert.equal(new Color("purple").toHex(), "800080");
            assert.equal(new Color("rebeccapurple").toHex(), "663399");
            assert.equal(new Color("red").toHex(), "ff0000");
            assert.equal(new Color("rosybrown").toHex(), "bc8f8f");
            assert.equal(new Color("royalblue").toHex(), "4169e1");
            assert.equal(new Color("saddlebrown").toHex(), "8b4513");
            assert.equal(new Color("salmon").toHex(), "fa8072");
            assert.equal(new Color("sandybrown").toHex(), "f4a460");
            assert.equal(new Color("seagreen").toHex(), "2e8b57");
            assert.equal(new Color("seashell").toHex(), "fff5ee");
            assert.equal(new Color("sienna").toHex(), "a0522d");
            assert.equal(new Color("silver").toHex(), "c0c0c0");
            assert.equal(new Color("skyblue").toHex(), "87ceeb");
            assert.equal(new Color("slateblue").toHex(), "6a5acd");
            assert.equal(new Color("slategray").toHex(), "708090");
            assert.equal(new Color("snow").toHex(), "fffafa");
            assert.equal(new Color("springgreen").toHex(), "00ff7f");
            assert.equal(new Color("steelblue").toHex(), "4682b4");
            assert.equal(new Color("tan").toHex(), "d2b48c");
            assert.equal(new Color("teal").toHex(), "008080");
            assert.equal(new Color("thistle").toHex(), "d8bfd8");
            assert.equal(new Color("tomato").toHex(), "ff6347");
            assert.equal(new Color("turquoise").toHex(), "40e0d0");
            assert.equal(new Color("violet").toHex(), "ee82ee");
            assert.equal(new Color("wheat").toHex(), "f5deb3");
            assert.equal(new Color("white").toHex(), "ffffff");
            assert.equal(new Color("whitesmoke").toHex(), "f5f5f5");
            assert.equal(new Color("yellow").toHex(), "ffff00");
            assert.equal(new Color("yellowgreen").toHex(), "9acd32");

            assert.equal(new Color("#f00").toName(), "red");
            assert.equal(new Color("#fa0a0a").toName(), false);
        });
    });

    describe("Alpha handling", () => {
        it("Invalid alpha should normalize to 1", () => {
            assert.equal(new Color({ r: 255, g: 20, b: 10, a: -1 }).toRgbString(), "rgb(255, 20, 10)", "Negative value");
            assert.equal(new Color({ r: 255, g: 20, b: 10, a: -0 }).toRgbString(), "rgba(255, 20, 10, 0)", "Negative 0");
            assert.equal(new Color({ r: 255, g: 20, b: 10, a: 0 }).toRgbString(), "rgba(255, 20, 10, 0)", "0");
            assert.equal(new Color({ r: 255, g: 20, b: 10, a: 0.5 }).toRgbString(), "rgba(255, 20, 10, 0.5)", ".5");
            assert.equal(new Color({ r: 255, g: 20, b: 10, a: 1 }).toRgbString(), "rgb(255, 20, 10)", "1");
            assert.equal(new Color({ r: 255, g: 20, b: 10, a: 100 }).toRgbString(), "rgb(255, 20, 10)", "Greater than 1");
            assert.equal(new Color({ r: 255, g: 20, b: 10, a: "asdfasd" }).toRgbString(), "rgb(255, 20, 10)", "Non Numeric");

            assert.equal(new Color("#fff").toRgbString(), "rgb(255, 255, 255)", "Hex should be 1");
            assert.equal(new Color("rgba 255 0 0 100").toRgbString(), "rgb(255, 0, 0)", "Greater than 1 in string parsing");
        });

        it("toString() with alpha set", () => {
            const redNamed = Color.fromRatio({ r: 255, g: 0, b: 0, a: 0.6 }, { format: "name" });
            const transparentNamed = Color.fromRatio({ r: 255, g: 0, b: 0, a: 0 }, { format: "name" });
            const redHex = Color.fromRatio({ r: 255, g: 0, b: 0, a: 0.4 }, { format: "hex" });

            assert.equal(redNamed.getFormat(), "name", "getFormat() is correct");
            assert.equal(redHex.getFormat(), "hex", "getFormat() is correct");

            assert.equal(redNamed.toString(), "rgba(255, 0, 0, 0.6)", "Names should default to rgba if alpha is < 1");
            assert.equal(redHex.toString(), "rgba(255, 0, 0, 0.4)", "Hex should default to rgba if alpha is < 1");

            assert.equal(redNamed.toString("hex"), "#ff0000", "Names should not be returned as rgba if format is specified");
            assert.equal(redNamed.toString("hex6"), "#ff0000", "Names should not be returned as rgba if format is specified");
            assert.equal(redNamed.toString("hex3"), "#f00", "Names should not be returned as rgba if format is specified");
            assert.equal(redNamed.toString("hex8"), "#ff000099", "Names should not be returned as rgba if format is specified");
            assert.equal(redNamed.toString("hex4"), "#f009", "Names should not be returned as rgba if format is specified");
            assert.equal(redNamed.toString("name"), "#ff0000", "Semi transparent names should return hex in toString() if name format is specified");

            assert.equal(redNamed.toName(), false, "Semi transparent names should be false in toName()");

            assert.equal(redHex.toString(), "rgba(255, 0, 0, 0.4)", "Hex should default to rgba if alpha is < 1");
            assert.equal(transparentNamed.toString(), "transparent", "Named color should equal transparent if alpha == 0");

            redHex.setAlpha(0);
            assert.equal(redHex.toString(), "rgba(255, 0, 0, 0)", "Hex should default to rgba if alpha is = 0");
        });

        it("setting alpha", () => {
            const hexSetter = new Color("rgba(255, 0, 0, 1)");
            assert.equal(hexSetter.getAlpha(), 1, "Alpha should start as 1");
            const returnedFromSetAlpha = hexSetter.setAlpha(0.9);
            assert.equal(returnedFromSetAlpha, hexSetter, "setAlpha return value should be the color.");
            assert.equal(hexSetter.getAlpha(), 0.9, "setAlpha should change alpha value");
            hexSetter.setAlpha(0.5);
            assert.equal(hexSetter.getAlpha(), 0.5, "setAlpha should change alpha value");
            hexSetter.setAlpha(0);
            assert.equal(hexSetter.getAlpha(), 0, "setAlpha should change alpha value");
            hexSetter.setAlpha(-1);
            assert.equal(hexSetter.getAlpha(), 1, "setAlpha with value < 0 should be bound to 1");
            hexSetter.setAlpha(2);
            assert.equal(hexSetter.getAlpha(), 1, "setAlpha with value > 1 should be bound to 1");
            hexSetter.setAlpha();
            assert.equal(hexSetter.getAlpha(), 1, "setAlpha with invalid value should be bound to 1");
            hexSetter.setAlpha(null);
            assert.equal(hexSetter.getAlpha(), 1, "setAlpha with invalid value should be bound to 1");
            hexSetter.setAlpha("test");
            assert.equal(hexSetter.getAlpha(), 1, "setAlpha with invalid value should be bound to 1");
        });

        it("Alpha = 0 should act differently on toName()", () => {
            assert.equal(new Color({ r: 255, g: 20, b: 10, a: 0 }).toName(), "transparent", "0");
            assert.equal(new Color("transparent").toString(), "transparent", "toString when passed");
            assert.equal(new Color("transparent").toHex(), "000000", "toHex");
        });
    });

    describe("Brightness handling", () => {
        it("getBrightness", () => {
            assert.equal(new Color("#000").getBrightness(), 0, "returns 0 for #000");
            assert.equal(new Color("#fff").getBrightness(), 255, "returns 255 for #fff");
        });

        it("getLuminance", () => {
            assert.equal(new Color("#000").getLuminance(), 0, "returns 0 for #000");
            assert.equal(new Color("#fff").getLuminance(), 1, "returns 1 for #fff");
        });

        it("isDark returns true/false for dark/light colors", () => {
            assert.equal(new Color("#000").isDark(), true, "#000 is dark");
            assert.equal(new Color("#111").isDark(), true, "#111 is dark");
            assert.equal(new Color("#222").isDark(), true, "#222 is dark");
            assert.equal(new Color("#333").isDark(), true, "#333 is dark");
            assert.equal(new Color("#444").isDark(), true, "#444 is dark");
            assert.equal(new Color("#555").isDark(), true, "#555 is dark");
            assert.equal(new Color("#666").isDark(), true, "#666 is dark");
            assert.equal(new Color("#777").isDark(), true, "#777 is dark");
            assert.equal(new Color("#888").isDark(), false, "#888 is not dark");
            assert.equal(new Color("#999").isDark(), false, "#999 is not dark");
            assert.equal(new Color("#aaa").isDark(), false, "#aaa is not dark");
            assert.equal(new Color("#bbb").isDark(), false, "#bbb is not dark");
            assert.equal(new Color("#ccc").isDark(), false, "#ccc is not dark");
            assert.equal(new Color("#ddd").isDark(), false, "#ddd is not dark");
            assert.equal(new Color("#eee").isDark(), false, "#eee is not dark");
            assert.equal(new Color("#fff").isDark(), false, "#fff is not dark");
        });

        it("isLight returns true/false for light/dark colors", () => {
            assert.equal(new Color("#000").isLight(), false, "#000 is not light");
            assert.equal(new Color("#111").isLight(), false, "#111 is not light");
            assert.equal(new Color("#222").isLight(), false, "#222 is not light");
            assert.equal(new Color("#333").isLight(), false, "#333 is not light");
            assert.equal(new Color("#444").isLight(), false, "#444 is not light");
            assert.equal(new Color("#555").isLight(), false, "#555 is not light");
            assert.equal(new Color("#666").isLight(), false, "#666 is not light");
            assert.equal(new Color("#777").isLight(), false, "#777 is not light");
            assert.equal(new Color("#888").isLight(), true, "#888 is light");
            assert.equal(new Color("#999").isLight(), true, "#999 is light");
            assert.equal(new Color("#aaa").isLight(), true, "#aaa is light");
            assert.equal(new Color("#bbb").isLight(), true, "#bbb is light");
            assert.equal(new Color("#ccc").isLight(), true, "#ccc is light");
            assert.equal(new Color("#ddd").isLight(), true, "#ddd is light");
            assert.equal(new Color("#eee").isLight(), true, "#eee is light");
            assert.equal(new Color("#fff").isLight(), true, "#fff is light");
        });
    });

    describe("Initialization from tinycolor output", () => {
        it("HSL Object", () => {
            for (let i = 0; i < conversions.length; i++) {
                const c = conversions[i];
                const tiny = new Color(c.hex);
                assert.equal(tiny.toHexString(), new Color(tiny.toHsl()).toHexString(), "HSL Object");
            }
        });

        it("HSL String", () => {
            for (let i = 0; i < conversions.length; i++) {
                const c = conversions[i];
                const tiny = new Color(c.hex);
                const input = tiny.toRgb();
                const output = new Color(tiny.toHslString()).toRgb();
                const maxDiff = 2;

                assert.equal(Math.abs(input.r - output.r) <= maxDiff, true, `toHslString red value difference <= ${maxDiff}`);
                assert.equal(Math.abs(input.g - output.g) <= maxDiff, true, `toHslString green value difference <= ${maxDiff}`);
                assert.equal(Math.abs(input.b - output.b) <= maxDiff, true, `toHslString blue value difference <= ${maxDiff}`);
            }
        });

        it("HSV String", () => {
            for (let i = 0; i < conversions.length; i++) {
                const c = conversions[i];
                const tiny = new Color(c.hex);
                const input = tiny.toRgb();
                const output = new Color(tiny.toHsvString()).toRgb();
                const maxDiff = 2;

                assert.equal(Math.abs(input.r - output.r) <= maxDiff, true, `toHsvString red value difference <= ${maxDiff}`);
                assert.equal(Math.abs(input.g - output.g) <= maxDiff, true, `toHsvString green value difference <= ${maxDiff}`);
                assert.equal(Math.abs(input.b - output.b) <= maxDiff, true, `toHsvString blue value difference <= ${maxDiff}`);
            }
        });

        it("HSV Object", () => {
            for (let i = 0; i < conversions.length; i++) {
                const c = conversions[i];
                const tiny = new Color(c.hex);
                assert.equal(tiny.toHexString(), new Color(tiny.toHsv()).toHexString(), "HSV Object");
            }
        });

        it("RGB Object", () => {
            for (let i = 0; i < conversions.length; i++) {
                const c = conversions[i];
                const tiny = new Color(c.hex);
                assert.equal(tiny.toHexString(), new Color(tiny.toRgb()).toHexString(), "RGB Object");
            }
        });

        it("RGB String", () => {
            for (let i = 0; i < conversions.length; i++) {
                const c = conversions[i];
                const tiny = new Color(c.hex);
                assert.equal(tiny.toHexString(), new Color(tiny.toRgbString()).toHexString(), "RGB String");
            }
        });

        it("PRGB Object", () => {
            for (let i = 0; i < conversions.length; i++) {
                const c = conversions[i];
                const tiny = new Color(c.hex);
                const input = tiny.toRgb();
                const output = new Color(tiny.toPercentageRgb()).toRgb();
                const maxDiff = 2;

                assert.equal(Math.abs(input.r - output.r) <= maxDiff, true, `Red value difference <= ${maxDiff}`);
                assert.equal(Math.abs(input.g - output.g) <= maxDiff, true, `Green value difference <= ${maxDiff}`);
                assert.equal(Math.abs(input.b - output.b) <= maxDiff, true, `Blue value difference <= ${maxDiff}`);
            }
        });

        it("PRGB String", () => {
            for (let i = 0; i < conversions.length; i++) {
                const c = conversions[i];
                const tiny = new Color(c.hex);
                const input = tiny.toRgb();
                const output = new Color(tiny.toPercentageRgbString()).toRgb();
                const maxDiff = 2;

                assert.equal(Math.abs(input.r - output.r) <= maxDiff, true, `Red value difference <= ${maxDiff}`);
                assert.equal(Math.abs(input.g - output.g) <= maxDiff, true, `Green value difference <= ${maxDiff}`);
                assert.equal(Math.abs(input.b - output.b) <= maxDiff, true, `Blue value difference <= ${maxDiff}`);
            }
        });

        it("Object", () => {
            for (let i = 0; i < conversions.length; i++) {
                const c = conversions[i];
                const tiny = new Color(c.hex);
                assert.equal(tiny.toHexString(), new Color(tiny).toHexString(), "Object");
            }
        });
    });

    describe("Utilities", () => {
        it("Color equality", () => {
            assert.true(Color.equals("#ff0000", "#ff0000"), "Same hex");
            assert.true(Color.equals("#ff0000", "rgb(255, 0, 0)"), "Same alphas");
            assert.true(!Color.equals("#ff0000", "rgba(255, 0, 0, .1)"), "Different alphas");
            assert.true(Color.equals("#ff000066", "rgba(255, 0, 0, .4)"), "Same alphas");
            assert.true(Color.equals("#f009", "rgba(255, 0, 0, .6)"), "Same alphas");
            assert.true(Color.equals("#336699CC", "369C"), "Same hex");
            assert.true(Color.equals("ff0000", "#ff0000"), "Same hex");
            assert.true(Color.equals("#f00", "#ff0000"), "Same hex");
            assert.true(Color.equals("#f00", "#ff0000"), "Same hex");
            assert.true(Color.equals("f00", "#ff0000"), "Same hex");
            assert.equal(new Color("010101").toHexString(), "#010101");
            assert.true(!Color.equals("#ff0000", "#00ff00"), "Different hex");
            assert.true(Color.equals("#ff8000", "rgb(100%, 50%, 0%)"), "Percentage bounds checking");
        });

        it("isReadable", () => {
            // "#ff0088", "#8822aa" (values used in old WCAG1 tests)
            assert.true(Color.isReadable("#000000", "#ffffff", { level: "AA", size: "small" }), "white/black is readable");
            assert.true(!Color.isReadable("#ff0088", "#5c1a72", {}), "not readable - empty wcag2 object");
            assert.true(!Color.isReadable("#ff0088", "#8822aa", { level: "AA", size: "small" }), "not readable - AA small");
            assert.true(!Color.isReadable("#ff0088", "#8822aa", { level: "AA", size: "large" }), "not  readable - AA large");
            assert.true(!Color.isReadable("#ff0088", "#8822aa", { level: "AAA", size: "small" }), "not readable - AAA small");
            assert.true(!Color.isReadable("#ff0088", "#8822aa", { level: "AAA", size: "large" }), "not readable - AAA large");

            // values derived from and validated using the calculators at http://www.dasplankton.de/ContrastA/
            // and http://webaim.org/resources/contrastchecker/

            // "#ff0088", "#5c1a72": contrast ratio 3.04
            assert.true(!Color.isReadable("#ff0088", "#5c1a72", { level: "AA", size: "small" }), "not readable - AA small");
            assert.true(Color.isReadable("#ff0088", "#5c1a72", { level: "AA", size: "large" }), "readable - AA large");
            assert.true(!Color.isReadable("#ff0088", "#5c1a72", { level: "AAA", size: "small" }), "not readable - AAA small");
            assert.true(!Color.isReadable("#ff0088", "#5c1a72", { level: "AAA", size: "large" }), "not readable - AAA large");

            // "#ff0088", "#2e0c3a": contrast ratio 4.56
            assert.true(Color.isReadable("#ff0088", "#2e0c3a", { level: "AA", size: "small" }), "readable - AA small");
            assert.true(Color.isReadable("#ff0088", "#2e0c3a", { level: "AA", size: "large" }), "readable - AA large");
            assert.true(!Color.isReadable("#ff0088", "#2e0c3a", { level: "AAA", size: "small" }), "not readable - AAA small");
            assert.true(Color.isReadable("#ff0088", "#2e0c3a", { level: "AAA", size: "large" }), "readable - AAA large");

            // "#db91b8", "#2e0c3a":  contrast ratio 7.12
            assert.true(Color.isReadable("#db91b8", "#2e0c3a", { level: "AA", size: "small" }), "readable - AA small");
            assert.true(Color.isReadable("#db91b8", "#2e0c3a", { level: "AA", size: "large" }), "readable - AA large");
            assert.true(Color.isReadable("#db91b8", "#2e0c3a", { level: "AAA", size: "small" }), "readable - AAA small");
            assert.true(Color.isReadable("#db91b8", "#2e0c3a", { level: "AAA", size: "large" }), "readable - AAA large");
        });

        it("readability", () => {
            // check return values from readability function. See isReadable above for standards tests.
            assert.equal(Color.readability("#000", "#000"), 1, "Readability function test 0");
            assert.deepEqual(Color.readability("#000", "#111"), 1.1121078324840545, "Readability function test 1");
            assert.deepEqual(Color.readability("#000", "#fff"), 21, "Readability function test 2");
        });

        it("mostReadable", () => {
            assert.equal(Color.mostReadable("#000", ["#111", "#222", { wcag2: {} }]).toHexString(), "#222222", "readable color present");
            assert.equal(Color.mostReadable("#f00", ["#d00", "#0d0"], { wcag2: {} }).toHexString(), "#00dd00", "readable color present");
            assert.equal(Color.mostReadable("#fff", ["#fff", "#fff"], { wcag2: {} }).toHexString(), "#ffffff", "no different color in list");
            //includeFallbackColors
            assert.equal(Color.mostReadable("#fff", ["#fff", "#fff"], { includeFallbackColors: true }).toHexString(), "#000000", "no different color in list");
            assert.equal(Color.mostReadable("#123", ["#124", "#125"], { includeFallbackColors: false }).toHexString(), "#112255", "no readable color in list");
            assert.equal(Color.mostReadable("#123", ["#000", "#fff"], { includeFallbackColors: false }).toHexString(), "#ffffff", "verify assumption");
            assert.equal(Color.mostReadable("#123", ["#124", "#125"], { includeFallbackColors: true }).toHexString(), "#ffffff", "no readable color in list");

            assert.equal(Color.mostReadable("#ff0088", ["#000", "#fff"], { includeFallbackColors: false }).toHexString(), "#000000", "verify assumption");
            assert.equal(Color.mostReadable("#ff0088", ["#2e0c3a"], { includeFallbackColors: true, level: "AAA", size: "large" }).toHexString(), "#2e0c3a", "readable color present");
            assert.equal(Color.mostReadable("#ff0088", ["#2e0c3a"], { includeFallbackColors: true, level: "AAA", size: "small" }).toHexString(), "#000000", "no readable color in list");

            assert.equal(Color.mostReadable("#371b2c", ["#000", "#fff"], { includeFallbackColors: false }).toHexString(), "#ffffff", "verify assumption");
            assert.equal(Color.mostReadable("#371b2c", ["#a9acb6"], { includeFallbackColors: true, level: "AAA", size: "large" }).toHexString(), "#a9acb6", "readable color present");
            assert.equal(Color.mostReadable("#371b2c", ["#a9acb6"], { includeFallbackColors: true, level: "AAA", size: "small" }).toHexString(), "#ffffff", "no readable color in list");
        });


        it("Filters", () => {
            assert.equal(new Color("red").toFilter(), "progid:DXImageTransform.Microsoft.gradient(startColorstr=#ffff0000,endColorstr=#ffff0000)");
            assert.equal(new Color("red").toFilter("blue"), "progid:DXImageTransform.Microsoft.gradient(startColorstr=#ffff0000,endColorstr=#ff0000ff)");

            assert.equal(new Color("transparent").toFilter(), "progid:DXImageTransform.Microsoft.gradient(startColorstr=#00000000,endColorstr=#00000000)");
            assert.equal(new Color("transparent").toFilter("red"), "progid:DXImageTransform.Microsoft.gradient(startColorstr=#00000000,endColorstr=#ffff0000)");

            assert.equal(new Color("#f0f0f0dd").toFilter(), "progid:DXImageTransform.Microsoft.gradient(startColorstr=#ddf0f0f0,endColorstr=#ddf0f0f0)");
            assert.equal(new Color("rgba(0, 0, 255, .5").toFilter(), "progid:DXImageTransform.Microsoft.gradient(startColorstr=#800000ff,endColorstr=#800000ff)");
        });
    });

    describe("Modifications", () => {
        /**
         * Originally generated with:
         * var results = [];
         * for (var i = 0; i <= 100; i++) results.push( Color.saturate("red", i).toHex() )
         * console.log(JSON.stringify(results))
         */
        const DESATURATIONS = ["ff0000", "fe0101", "fc0303", "fb0404", "fa0505", "f90606", "f70808", "f60909", "f50a0a", "f40b0b", "f20d0d", "f10e0e", "f00f0f", "ee1111", "ed1212", "ec1313", "eb1414", "e91616", "e81717", "e71818", "e61919", "e41b1b", "e31c1c", "e21d1d", "e01f1f", "df2020", "de2121", "dd2222", "db2424", "da2525", "d92626", "d72828", "d62929", "d52a2a", "d42b2b", "d22d2d", "d12e2e", "d02f2f", "cf3030", "cd3232", "cc3333", "cb3434", "c93636", "c83737", "c73838", "c63939", "c43b3b", "c33c3c", "c23d3d", "c13e3e", "bf4040", "be4141", "bd4242", "bb4444", "ba4545", "b94646", "b84747", "b64949", "b54a4a", "b44b4b", "b34d4d", "b14e4e", "b04f4f", "af5050", "ad5252", "ac5353", "ab5454", "aa5555", "a85757", "a75858", "a65959", "a45b5b", "a35c5c", "a25d5d", "a15e5e", "9f6060", "9e6161", "9d6262", "9c6363", "9a6565", "996666", "986767", "966969", "956a6a", "946b6b", "936c6c", "916e6e", "906f6f", "8f7070", "8e7171", "8c7373", "8b7474", "8a7575", "887777", "877878", "867979", "857a7a", "837c7c", "827d7d", "817e7e", "808080"];
        const SATURATIONS = ["ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000", "ff0000"];
        const LIGHTENS = ["ff0000", "ff0505", "ff0a0a", "ff0f0f", "ff1414", "ff1a1a", "ff1f1f", "ff2424", "ff2929", "ff2e2e", "ff3333", "ff3838", "ff3d3d", "ff4242", "ff4747", "ff4d4d", "ff5252", "ff5757", "ff5c5c", "ff6161", "ff6666", "ff6b6b", "ff7070", "ff7575", "ff7a7a", "ff8080", "ff8585", "ff8a8a", "ff8f8f", "ff9494", "ff9999", "ff9e9e", "ffa3a3", "ffa8a8", "ffadad", "ffb3b3", "ffb8b8", "ffbdbd", "ffc2c2", "ffc7c7", "ffcccc", "ffd1d1", "ffd6d6", "ffdbdb", "ffe0e0", "ffe5e5", "ffebeb", "fff0f0", "fff5f5", "fffafa", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff", "ffffff"];
        const BRIGHTENS = ["ff0000", "ff0303", "ff0505", "ff0808", "ff0a0a", "ff0d0d", "ff0f0f", "ff1212", "ff1414", "ff1717", "ff1919", "ff1c1c", "ff1f1f", "ff2121", "ff2424", "ff2626", "ff2929", "ff2b2b", "ff2e2e", "ff3030", "ff3333", "ff3636", "ff3838", "ff3b3b", "ff3d3d", "ff4040", "ff4242", "ff4545", "ff4747", "ff4a4a", "ff4c4c", "ff4f4f", "ff5252", "ff5454", "ff5757", "ff5959", "ff5c5c", "ff5e5e", "ff6161", "ff6363", "ff6666", "ff6969", "ff6b6b", "ff6e6e", "ff7070", "ff7373", "ff7575", "ff7878", "ff7a7a", "ff7d7d", "ff7f7f", "ff8282", "ff8585", "ff8787", "ff8a8a", "ff8c8c", "ff8f8f", "ff9191", "ff9494", "ff9696", "ff9999", "ff9c9c", "ff9e9e", "ffa1a1", "ffa3a3", "ffa6a6", "ffa8a8", "ffabab", "ffadad", "ffb0b0", "ffb2b2", "ffb5b5", "ffb8b8", "ffbaba", "ffbdbd", "ffbfbf", "ffc2c2", "ffc4c4", "ffc7c7", "ffc9c9", "ffcccc", "ffcfcf", "ffd1d1", "ffd4d4", "ffd6d6", "ffd9d9", "ffdbdb", "ffdede", "ffe0e0", "ffe3e3", "ffe5e5", "ffe8e8", "ffebeb", "ffeded", "fff0f0", "fff2f2", "fff5f5", "fff7f7", "fffafa", "fffcfc", "ffffff"];
        const DARKENS = ["ff0000", "fa0000", "f50000", "f00000", "eb0000", "e60000", "e00000", "db0000", "d60000", "d10000", "cc0000", "c70000", "c20000", "bd0000", "b80000", "b30000", "ad0000", "a80000", "a30000", "9e0000", "990000", "940000", "8f0000", "8a0000", "850000", "800000", "7a0000", "750000", "700000", "6b0000", "660000", "610000", "5c0000", "570000", "520000", "4d0000", "470000", "420000", "3d0000", "380000", "330000", "2e0000", "290000", "240000", "1f0000", "190000", "140000", "0f0000", "0a0000", "050000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000"];

        it("Modifications", () => {
            for (let i = 0; i <= 100; i++) {
                assert.equal(new Color("red").desaturate(i).toHex(), DESATURATIONS[i], `Desaturation ${i} works`);
            }
            for (let i = 0; i <= 100; i++) {
                assert.equal(new Color("red").saturate(i).toHex(), SATURATIONS[i], `Saturation ${i} works`);
            }
            for (let i = 0; i <= 100; i++) {
                assert.equal(new Color("red").lighten(i).toHex(), LIGHTENS[i], `Lighten ${i} works`);
            }
            for (let i = 0; i <= 100; i++) {
                assert.equal(new Color("red").brighten(i).toHex(), BRIGHTENS[i], `Brighter ${i} works`);
            }
            for (let i = 0; i <= 100; i++) {
                assert.equal(new Color("red").darken(i).toHex(), DARKENS[i], `Darken ${i} works`);
            }

            assert.equal(new Color("red").greyscale().toHex(), "808080", "Greyscale works");
        });

        it("Spin", () => {
            assert.equal(Math.round(new Color("#f00").spin(-1234).toHsl().h), 206, "Spinning -1234 works");
            assert.equal(Math.round(new Color("#f00").spin(-360).toHsl().h), 0, "Spinning -360 works");
            assert.equal(Math.round(new Color("#f00").spin(-120).toHsl().h), 240, "Spinning -120 works");
            assert.equal(Math.round(new Color("#f00").spin(0).toHsl().h), 0, "Spinning 0 works");
            assert.equal(Math.round(new Color("#f00").spin(10).toHsl().h), 10, "Spinning 10 works");
            assert.equal(Math.round(new Color("#f00").spin(360).toHsl().h), 0, "Spinning 360 works");
            assert.equal(Math.round(new Color("#f00").spin(2345).toHsl().h), 185, "Spinning 2345 works");

            [-360, 0, 360].forEach((delta) => {
                Object.keys(Color.names).forEach((name) => {
                    assert.equal(new Color(name).toHex(), new Color(name).spin(delta).toHex(), `Spinning ${delta.toString()} has no effect`);
                });
            });
        });

        it("Mix", () => {
            // amount 0 or none
            assert.equal(Color.mix("#000", "#fff").toHsl().l, 0.5, "Mixing without amount works");
            assert.equal(Color.mix("#f00", "#000", 0).toHex(), "ff0000", "Mixing with 0 amount works");
            // This case checks the the problem with floating point numbers (eg 255/90)
            assert.equal(Color.mix("#fff", "#000", 90).toHex(), "1a1a1a", "Mixing with 90 amount works correctly");

            // black and white
            for (let i = 0; i < 100; i++) {
                assert.equal(Math.round(Color.mix("#000", "#fff", i).toHsl().l * 100) / 100, i / 100, `Mixing black and white with ${i} amount works`);
            }

            // with colors
            for (let i = 0; i < 100; i++) {
                let newHex = Math.round((255 * (100 - i)) / 100).toString(16);

                if (newHex.length === 1) {
                    newHex = `0${newHex}`;
                }

                assert.equal(Color.mix("#f00", "#000", i).toHex(), `${newHex}0000`, `Mixing ${i} (red channel)`);
                assert.equal(Color.mix("#0f0", "#000", i).toHex(), `00${newHex}00`, `Mixing ${i} (green channel)`);
                assert.equal(Color.mix("#00f", "#000", i).toHex(), `0000${newHex}`, `Mixing ${i} (blue channel)`);
                assert.equal(Color.mix(new Color("transparent"), "#000", i).toRgb().a, i / 100, `Mixing ${i} (alpha channel)`);
            }
        });
    });

    // The combination tests need to be expanded further
    describe("Combinations", () => {
        const colorsToHexString = function (colors) {
            return colors.map((c) => {
                return c.toHex();
            }).join(",");
        };

        it("complement", () => {
            const complementDoesntModifyInstance = new Color("red");
            assert.equal(complementDoesntModifyInstance.complement().toHex(), "00ffff", "Complement works");
            assert.equal(complementDoesntModifyInstance.toHex(), "ff0000", "Complement did not modify this color");
        });

        it("analogous", () => {
            const combination = new Color("red").analogous();
            assert.equal(colorsToHexString(combination), "ff0000,ff0066,ff0033,ff0000,ff3300,ff6600", "Correct Combination");
        });

        it("monochromatic", () => {
            const combination = new Color("red").monochromatic();
            assert.equal(colorsToHexString(combination), "ff0000,2a0000,550000,800000,aa0000,d40000", "Correct Combination");
        });

        it("splitcomplement", () => {
            const combination = new Color("red").splitcomplement();
            assert.equal(colorsToHexString(combination), "ff0000,ccff00,0066ff", "Correct Combination");
        });

        it("triad", () => {
            const combination = new Color("red").triad();
            assert.equal(colorsToHexString(combination), "ff0000,00ff00,0000ff", "Correct Combination");
        });

        it("tetrad", () => {
            const combination = new Color("red").tetrad();
            assert.equal(colorsToHexString(combination), "ff0000,80ff00,00ffff,7f00ff", "Correct Combination");
        });
    });
});
