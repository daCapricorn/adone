import commonLocaleTests from "../helpers/common-locale";
describe("ar-tn", () => {
    commonLocaleTests("ar-tn");

    before(() => {
        adone.datetime.locale("ar-tn");
    });

    after(() => {
        adone.datetime.locale("en");
    });

    it("parse", () => {
        const tests = "جانفي:جانفي_فيفري:فيفري_مارس:مارس_أفريل:أفريل_ماي:ماي_جوان:جوان_جويلية:جويلية_أوت:أوت_سبتمبر:سبتمبر_أكتوبر:أكتوبر_نوفمبر:نوفمبر_ديسمبر:ديسمبر".split("_");
        let i;

        function equalTest(input, mmm, i) {
            assert.equal(adone.datetime(input, mmm).month(), i, input + " should be month " + (i + 1));
        }
        for (i = 0; i < 12; i++) {
            tests[i] = tests[i].split(":");
            equalTest(tests[i][0], "MMM", i);
            equalTest(tests[i][1], "MMM", i);
            equalTest(tests[i][0], "MMMM", i);
            equalTest(tests[i][1], "MMMM", i);
            equalTest(tests[i][0].toLocaleLowerCase(), "MMMM", i);
            equalTest(tests[i][1].toLocaleLowerCase(), "MMMM", i);
            equalTest(tests[i][0].toLocaleUpperCase(), "MMMM", i);
            equalTest(tests[i][1].toLocaleUpperCase(), "MMMM", i);
        }
    });

    it("format", () => {
        const a = [
            ["dddd, MMMM Do YYYY, h:mm:ss a", "الأحد, فيفري 14 2010, 3:25:50 pm"],
            ["ddd, hA", "أحد, 3PM"],
            ["M Mo MM MMMM MMM", "2 2 02 فيفري فيفري"],
            ["YYYY YY", "2010 10"],
            ["D Do DD", "14 14 14"],
            ["d do dddd ddd dd", "0 0 الأحد أحد ح"],
            ["DDD DDDo DDDD", "45 45 045"],
            ["w wo ww", "6 6 06"],
            ["h hh", "3 03"],
            ["H HH", "15 15"],
            ["m mm", "25 25"],
            ["s ss", "50 50"],
            ["a A", "pm PM"],
            ["[the] DDDo [day of the year]", "the 45 day of the year"],
            ["LT", "15:25"],
            ["LTS", "15:25:50"],
            ["L", "14/02/2010"],
            ["LL", "14 فيفري 2010"],
            ["LLL", "14 فيفري 2010 15:25"],
            ["LLLL", "الأحد 14 فيفري 2010 15:25"],
            ["l", "14/2/2010"],
            ["ll", "14 فيفري 2010"],
            ["lll", "14 فيفري 2010 15:25"],
            ["llll", "أحد 14 فيفري 2010 15:25"]
        ];
        const b = adone.datetime(new Date(2010, 1, 14, 15, 25, 50, 125));
        let i;

        for (i = 0; i < a.length; i++) {
            assert.equal(b.format(a[i][0]), a[i][1], a[i][0] + " ---> " + a[i][1]);
        }
    });

    it("format ordinal", () => {
        assert.equal(adone.datetime([2011, 0, 1]).format("DDDo"), "1", "1");
        assert.equal(adone.datetime([2011, 0, 2]).format("DDDo"), "2", "2");
        assert.equal(adone.datetime([2011, 0, 3]).format("DDDo"), "3", "3");
        assert.equal(adone.datetime([2011, 0, 4]).format("DDDo"), "4", "4");
        assert.equal(adone.datetime([2011, 0, 5]).format("DDDo"), "5", "5");
        assert.equal(adone.datetime([2011, 0, 6]).format("DDDo"), "6", "6");
        assert.equal(adone.datetime([2011, 0, 7]).format("DDDo"), "7", "7");
        assert.equal(adone.datetime([2011, 0, 8]).format("DDDo"), "8", "8");
        assert.equal(adone.datetime([2011, 0, 9]).format("DDDo"), "9", "9");
        assert.equal(adone.datetime([2011, 0, 10]).format("DDDo"), "10", "10");

        assert.equal(adone.datetime([2011, 0, 11]).format("DDDo"), "11", "11");
        assert.equal(adone.datetime([2011, 0, 12]).format("DDDo"), "12", "12");
        assert.equal(adone.datetime([2011, 0, 13]).format("DDDo"), "13", "13");
        assert.equal(adone.datetime([2011, 0, 14]).format("DDDo"), "14", "14");
        assert.equal(adone.datetime([2011, 0, 15]).format("DDDo"), "15", "15");
        assert.equal(adone.datetime([2011, 0, 16]).format("DDDo"), "16", "16");
        assert.equal(adone.datetime([2011, 0, 17]).format("DDDo"), "17", "17");
        assert.equal(adone.datetime([2011, 0, 18]).format("DDDo"), "18", "18");
        assert.equal(adone.datetime([2011, 0, 19]).format("DDDo"), "19", "19");
        assert.equal(adone.datetime([2011, 0, 20]).format("DDDo"), "20", "20");

        assert.equal(adone.datetime([2011, 0, 21]).format("DDDo"), "21", "21");
        assert.equal(adone.datetime([2011, 0, 22]).format("DDDo"), "22", "22");
        assert.equal(adone.datetime([2011, 0, 23]).format("DDDo"), "23", "23");
        assert.equal(adone.datetime([2011, 0, 24]).format("DDDo"), "24", "24");
        assert.equal(adone.datetime([2011, 0, 25]).format("DDDo"), "25", "25");
        assert.equal(adone.datetime([2011, 0, 26]).format("DDDo"), "26", "26");
        assert.equal(adone.datetime([2011, 0, 27]).format("DDDo"), "27", "27");
        assert.equal(adone.datetime([2011, 0, 28]).format("DDDo"), "28", "28");
        assert.equal(adone.datetime([2011, 0, 29]).format("DDDo"), "29", "29");
        assert.equal(adone.datetime([2011, 0, 30]).format("DDDo"), "30", "30");

        assert.equal(adone.datetime([2011, 0, 31]).format("DDDo"), "31", "31");
    });

    it("format month", () => {
        const expected = "جانفي جانفي_فيفري فيفري_مارس مارس_أفريل أفريل_ماي ماي_جوان جوان_جويلية جويلية_أوت أوت_سبتمبر سبتمبر_أكتوبر أكتوبر_نوفمبر نوفمبر_ديسمبر ديسمبر".split("_");
        let i;

        for (i = 0; i < expected.length; i++) {
            assert.equal(adone.datetime([2011, i, 1]).format("MMMM MMM"), expected[i], expected[i]);
        }
    });

    it("format week", () => {
        const expected = "الأحد أحد ح_الإثنين إثنين ن_الثلاثاء ثلاثاء ث_الأربعاء أربعاء ر_الخميس خميس خ_الجمعة جمعة ج_السبت سبت س".split("_");
        let i;

        for (i = 0; i < expected.length; i++) {
            assert.equal(adone.datetime([2011, 0, 2 + i]).format("dddd ddd dd"), expected[i], expected[i]);
        }
    });

    it("from", () => {
        const start = adone.datetime([2007, 1, 28]);
        assert.equal(start.from(adone.datetime([2007, 1, 28]).add({
            s: 44
        }), true), "ثوان", "44 seconds = a few seconds");
        assert.equal(start.from(adone.datetime([2007, 1, 28]).add({
            s: 45
        }), true), "دقيقة", "45 seconds = a minute");
        assert.equal(start.from(adone.datetime([2007, 1, 28]).add({
            s: 89
        }), true), "دقيقة", "89 seconds = a minute");
        assert.equal(start.from(adone.datetime([2007, 1, 28]).add({
            s: 90
        }), true), "2 دقائق", "90 seconds = 2 minutes");
        assert.equal(start.from(adone.datetime([2007, 1, 28]).add({
            m: 44
        }), true), "44 دقائق", "44 minutes = 44 minutes");
        assert.equal(start.from(adone.datetime([2007, 1, 28]).add({
            m: 45
        }), true), "ساعة", "45 minutes = an hour");
        assert.equal(start.from(adone.datetime([2007, 1, 28]).add({
            m: 89
        }), true), "ساعة", "89 minutes = an hour");
        assert.equal(start.from(adone.datetime([2007, 1, 28]).add({
            m: 90
        }), true), "2 ساعات", "90 minutes = 2 hours");
        assert.equal(start.from(adone.datetime([2007, 1, 28]).add({
            h: 5
        }), true), "5 ساعات", "5 hours = 5 hours");
        assert.equal(start.from(adone.datetime([2007, 1, 28]).add({
            h: 21
        }), true), "21 ساعات", "21 hours = 21 hours");
        assert.equal(start.from(adone.datetime([2007, 1, 28]).add({
            h: 22
        }), true), "يوم", "22 hours = a day");
        assert.equal(start.from(adone.datetime([2007, 1, 28]).add({
            h: 35
        }), true), "يوم", "35 hours = a day");
        assert.equal(start.from(adone.datetime([2007, 1, 28]).add({
            h: 36
        }), true), "2 أيام", "36 hours = 2 days");
        assert.equal(start.from(adone.datetime([2007, 1, 28]).add({
            d: 1
        }), true), "يوم", "1 day = a day");
        assert.equal(start.from(adone.datetime([2007, 1, 28]).add({
            d: 5
        }), true), "5 أيام", "5 days = 5 days");
        assert.equal(start.from(adone.datetime([2007, 1, 28]).add({
            d: 25
        }), true), "25 أيام", "25 days = 25 days");
        assert.equal(start.from(adone.datetime([2007, 1, 28]).add({
            d: 26
        }), true), "شهر", "26 days = a month");
        assert.equal(start.from(adone.datetime([2007, 1, 28]).add({
            d: 30
        }), true), "شهر", "30 days = a month");
        assert.equal(start.from(adone.datetime([2007, 1, 28]).add({
            d: 43
        }), true), "شهر", "43 days = a month");
        assert.equal(start.from(adone.datetime([2007, 1, 28]).add({
            d: 46
        }), true), "2 أشهر", "46 days = 2 months");
        assert.equal(start.from(adone.datetime([2007, 1, 28]).add({
            d: 74
        }), true), "2 أشهر", "75 days = 2 months");
        assert.equal(start.from(adone.datetime([2007, 1, 28]).add({
            d: 76
        }), true), "3 أشهر", "76 days = 3 months");
        assert.equal(start.from(adone.datetime([2007, 1, 28]).add({
            M: 1
        }), true), "شهر", "1 month = a month");
        assert.equal(start.from(adone.datetime([2007, 1, 28]).add({
            M: 5
        }), true), "5 أشهر", "5 months = 5 months");
        assert.equal(start.from(adone.datetime([2007, 1, 28]).add({
            d: 345
        }), true), "سنة", "345 days = a year");
        assert.equal(start.from(adone.datetime([2007, 1, 28]).add({
            d: 548
        }), true), "2 سنوات", "548 days = 2 years");
        assert.equal(start.from(adone.datetime([2007, 1, 28]).add({
            y: 1
        }), true), "سنة", "1 year = a year");
        assert.equal(start.from(adone.datetime([2007, 1, 28]).add({
            y: 5
        }), true), "5 سنوات", "5 years = 5 years");
    });

    it("suffix", () => {
        assert.equal(adone.datetime(30000).from(0), "في ثوان", "prefix");
        assert.equal(adone.datetime(0).from(30000), "منذ ثوان", "suffix");
    });

    it("now from now", () => {
        assert.equal(adone.datetime().fromNow(), "منذ ثوان", "now from now should display as in the past");
    });

    it("fromNow", () => {
        assert.equal(adone.datetime().add({
            s: 30
        }).fromNow(), "في ثوان", "in a few seconds");
        assert.equal(adone.datetime().add({
            d: 5
        }).fromNow(), "في 5 أيام", "in 5 days");
    });

    it("calendar day", () => {
        const a = adone.datetime().hours(12).minutes(0).seconds(0);

        assert.equal(adone.datetime(a).calendar(), "اليوم على الساعة 12:00", "today at the same time");
        assert.equal(adone.datetime(a).add({
            m: 25
        }).calendar(), "اليوم على الساعة 12:25", "Now plus 25 min");
        assert.equal(adone.datetime(a).add({
            h: 1
        }).calendar(), "اليوم على الساعة 13:00", "Now plus 1 hour");
        assert.equal(adone.datetime(a).add({
            d: 1
        }).calendar(), "غدا على الساعة 12:00", "tomorrow at the same time");
        assert.equal(adone.datetime(a).subtract({
            h: 1
        }).calendar(), "اليوم على الساعة 11:00", "Now minus 1 hour");
        assert.equal(adone.datetime(a).subtract({
            d: 1
        }).calendar(), "أمس على الساعة 12:00", "yesterday at the same time");
    });

    it("calendar next week", () => {
        let i;
        let m;

        for (i = 2; i < 7; i++) {
            m = adone.datetime().add({
                d: i
            });
            assert.equal(m.calendar(), m.format("dddd [على الساعة] LT"), "Today + " + i + " days current time");
            m.hours(0).minutes(0).seconds(0).milliseconds(0);
            assert.equal(m.calendar(), m.format("dddd [على الساعة] LT"), "Today + " + i + " days beginning of day");
            m.hours(23).minutes(59).seconds(59).milliseconds(999);
            assert.equal(m.calendar(), m.format("dddd [على الساعة] LT"), "Today + " + i + " days end of day");
        }
    });

    it("calendar last week", () => {
        let i;
        let m;

        for (i = 2; i < 7; i++) {
            m = adone.datetime().subtract({
                d: i
            });
            assert.equal(m.calendar(), m.format("dddd [على الساعة] LT"), "Today - " + i + " days current time");
            m.hours(0).minutes(0).seconds(0).milliseconds(0);
            assert.equal(m.calendar(), m.format("dddd [على الساعة] LT"), "Today - " + i + " days beginning of day");
            m.hours(23).minutes(59).seconds(59).milliseconds(999);
            assert.equal(m.calendar(), m.format("dddd [على الساعة] LT"), "Today - " + i + " days end of day");
        }
    });

    it("calendar all else", () => {
        let weeksAgo = adone.datetime().subtract({
            w: 1
        });
        let weeksFromNow = adone.datetime().add({
            w: 1
        });

        assert.equal(weeksAgo.calendar(), weeksAgo.format("L"), "1 week ago");
        assert.equal(weeksFromNow.calendar(), weeksFromNow.format("L"), "in 1 week");

        weeksAgo = adone.datetime().subtract({
            w: 2
        });
        weeksFromNow = adone.datetime().add({
            w: 2
        });

        assert.equal(weeksAgo.calendar(), weeksAgo.format("L"), "2 weeks ago");
        assert.equal(weeksFromNow.calendar(), weeksFromNow.format("L"), "in 2 weeks");
    });

    it("weeks year starting sunday formatted", () => {
        assert.equal(adone.datetime([2012, 0, 1]).format("w ww wo"), "52 52 52", "Jan  1 2012 should be week 52");
        assert.equal(adone.datetime([2012, 0, 2]).format("w ww wo"), "1 01 1", "Jan  2 2012 should be week 1");
        assert.equal(adone.datetime([2012, 0, 8]).format("w ww wo"), "1 01 1", "Jan  8 2012 should be week 1");
        assert.equal(adone.datetime([2012, 0, 9]).format("w ww wo"), "2 02 2", "Jan  9 2012 should be week 2");
        assert.equal(adone.datetime([2012, 0, 15]).format("w ww wo"), "2 02 2", "Jan 15 2012 should be week 2");
    });
});