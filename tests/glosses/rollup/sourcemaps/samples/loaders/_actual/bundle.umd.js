(function (factory) {
	typeof define === 'function' && define.amd ? define(factory) :
	factory();
}(function () { 'use strict';

	/*misalign*/var foo = function () { return 20; };

	/*the*/var bar = function () { return 22; };

	/*columns*/console.log( ("the answer is " + (foo() + bar())) );

}));
//# sourceMappingURL=bundle.umd.js.map