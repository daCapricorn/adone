define(['./generated-chunk'],function(__chunk_1){'use strict';function fn () {
  console.log('dep1 fn');
}class Main1 {
  constructor () {
    fn();
    __chunk_1.f();
  }
}return Main1;});