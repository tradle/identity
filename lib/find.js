
module.exports = function find(arr, fn, ctx) {
  var match;
  arr.some(function(arg, idx) {
    match = ctx ? fn.call(ctx, arg, idx) : fn(arg, idx);
    return match === true ? arg : match;
  });

  return match;
}
