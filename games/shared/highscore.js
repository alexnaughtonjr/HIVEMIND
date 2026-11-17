/* Personal bests for this collection. localStorage only, no network.
   Key: hivemind.highscore.<slug>
   HivemindHighscore.get(slug, legacyKey) -> number | null
   HivemindHighscore.submit(slug, value, { mode: "max" | "min", legacy }) ->
     { value, best, previous, improved, saved }
   mode "max" (default) keeps the higher number. mode "min" keeps the lower one.
   A legacy key is copied once when the namespaced key is still empty.
   Storage can throw in private mode. Both calls fail soft and return null / saved: false.
*/
(function (root) {
  "use strict";

  var PREFIX = "hivemind.highscore.";

  function storage() {
    try {
      var ls = root.localStorage;
      return ls || null;
    } catch (err) {
      return null;
    }
  }

  function read(ls, key) {
    try {
      var raw = ls.getItem(key);
      if (raw == null || raw === "") return null;
      var n = Number(raw);
      return Number.isFinite(n) ? n : null;
    } catch (err) {
      return null;
    }
  }

  function write(ls, key, n) {
    try {
      ls.setItem(key, String(n));
      return true;
    } catch (err) {
      return false;
    }
  }

  function namespaced(slug) {
    return PREFIX + String(slug);
  }

  function get(slug, legacyKey) {
    var ls = storage();
    if (!ls) return null;
    var current = read(ls, namespaced(slug));
    if (current != null) return current;
    if (!legacyKey) return null;
    var old = read(ls, legacyKey);
    if (old == null) return null;
    write(ls, namespaced(slug), old);
    return old;
  }

  function better(mode, value, previous) {
    if (previous == null) return true;
    if (mode === "min") return value < previous;
    return value > previous;
  }

  function submit(slug, value, options) {
    var opts = options || {};
    var mode = opts.mode === "min" ? "min" : "max";
    var numeric = Number(value);
    var result = {
      value: Number.isFinite(numeric) ? numeric : null,
      best: null,
      previous: null,
      improved: false,
      saved: false
    };
    var previous = get(slug, opts.legacy);
    result.previous = previous;
    result.best = previous;
    if (!Number.isFinite(numeric) || numeric <= 0) return result;
    if (!better(mode, numeric, previous)) return result;
    result.best = numeric;
    result.improved = true;
    var ls = storage();
    if (ls) result.saved = write(ls, namespaced(slug), numeric);
    return result;
  }

  root.HivemindHighscore = {
    get: get,
    submit: submit,
    key: namespaced
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
