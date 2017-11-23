module.exports = WktParser;

const Types = require("./types");
const Point = require("./point");

function WktParser(value) {
    this.value = value;
    this.position = 0;
}

WktParser.prototype.match = function (tokens) {
    this.skipWhitespaces();

    for (let i = 0; i < tokens.length; i++) {
        if (this.value.substring(this.position).indexOf(tokens[i]) === 0) {
            this.position += tokens[i].length;
            return tokens[i];
        }
    }

    return null;
};

WktParser.prototype.matchRegex = function (tokens) {
    this.skipWhitespaces();

    for (let i = 0; i < tokens.length; i++) {
        const match = this.value.substring(this.position).match(tokens[i]);

        if (match) {
            this.position += match[0].length;
            return match;
        }
    }

    return null;
};

WktParser.prototype.isMatch = function (tokens) {
    this.skipWhitespaces();

    for (let i = 0; i < tokens.length; i++) {
        if (this.value.substring(this.position).indexOf(tokens[i]) === 0) {
            this.position += tokens[i].length;
            return true;
        }
    }

    return false;
};

WktParser.prototype.matchType = function () {
    const geometryType = this.match([Types.wkt.Point, Types.wkt.LineString, Types.wkt.Polygon, Types.wkt.MultiPoint,
        Types.wkt.MultiLineString, Types.wkt.MultiPolygon, Types.wkt.GeometryCollection]);

    if (!geometryType) {
        throw new Error("Expected geometry type");
    }

    return geometryType;
};

WktParser.prototype.matchDimension = function () {
    const dimension = this.match(["ZM", "Z", "M"]);

    switch (dimension) {
        case "ZM": return { hasZ: true, hasM: true };
        case "Z": return { hasZ: true, hasM: false };
        case "M": return { hasZ: false, hasM: true };
        default: return { hasZ: false, hasM: false };
    }
};

WktParser.prototype.expectGroupStart = function () {
    if (!this.isMatch(["("])) {
        throw new Error("Expected group start");
    }
};

WktParser.prototype.expectGroupEnd = function () {
    if (!this.isMatch([")"])) {
        throw new Error("Expected group end");
    }
};

WktParser.prototype.matchCoordinate = function (options) {
    let match;

    if (options.hasZ && options.hasM) {
        match = this.matchRegex([/^(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)/]);
    } else if (options.hasZ || options.hasM) {
        match = this.matchRegex([/^(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)/]);
    } else {
        match = this.matchRegex([/^(-?\d+\.?\d*)\s+(-?\d+\.?\d*)/]);
    }

    if (!match) {
        throw new Error("Expected coordinates");
    }

    if (options.hasZ && options.hasM) {
        return new Point(parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3]), parseFloat(match[4]));
    } else if (options.hasZ) {
        return new Point(parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3]));
    } else if (options.hasM) {
        return new Point(parseFloat(match[1]), parseFloat(match[2]), undefined, parseFloat(match[3]));
    }
    return new Point(parseFloat(match[1]), parseFloat(match[2]));
};

WktParser.prototype.matchCoordinates = function (options) {
    const coordinates = [];

    do {
        const startsWithBracket = this.isMatch(["("]);

        coordinates.push(this.matchCoordinate(options));

        if (startsWithBracket) {
            this.expectGroupEnd();
        }
    } while (this.isMatch([","]));

    return coordinates;
};

WktParser.prototype.skipWhitespaces = function () {
    while (this.position < this.value.length && this.value[this.position] === " ") {
        this.position++;
    }
};