import { a as ce, b as _, b_ as Rt, b$ as _n, e as wt, c0 as qn, j as N, c1 as Hn, u as Vn, R as zn, q as Un, d as $n, H as Gn, c as Kn } from "./index-e7c4aa3c.mjs";
import { E as p, F as de, v as Ee, S as Re, o as d, w as _e, C as Jn, x as jn, y as Tt, z as Ot, A as Se, B as It, G as Pt, H as Wt, J as Ue, K as Xe, M as w, O as Z, g as et, b as $e, Q as Qn, R as ee, V as Ft, U as x, W as Yn, X as Zn, Y as ue, Z as L, _ as Xn, $ as er, a0 as tt, a1 as he, a2 as tr, a3 as nr, a4 as rr, a5 as or, a6 as ir, a7 as sr, a8 as lr, a9 as ar, aa as cr, ab as ur, ac as hr, ad as fr, ae as dr, af as mr, ag as Nt, ah as gr, ai as pr, aj as yr, ak as xr, al as kr, am as br, an as _t, ao as Sr, ap as Cr, t as f, aq as vr } from "./index-9cc1df42.mjs";
const Ar = (t) => {
  let { state: e } = t, r = e.doc.lineAt(e.selection.main.from), n = rt(t.state, r.from);
  return n.line ? Mr(t) : n.block ? Br(t) : !1;
};
function nt(t, e) {
  return ({ state: r, dispatch: n }) => {
    if (r.readOnly)
      return !1;
    let o = t(e, r);
    return o ? (n(r.update(o)), !0) : !1;
  };
}
const Mr = /* @__PURE__ */ nt(
  Rr,
  0
  /* CommentOption.Toggle */
), Lr = /* @__PURE__ */ nt(
  qt,
  0
  /* CommentOption.Toggle */
), Br = /* @__PURE__ */ nt(
  (t, e) => qt(t, e, Er(e)),
  0
  /* CommentOption.Toggle */
);
function rt(t, e) {
  let r = t.languageDataAt("commentTokens", e);
  return r.length ? r[0] : {};
}
const ae = 50;
function Dr(t, { open: e, close: r }, n, o) {
  let i = t.sliceDoc(n - ae, n), s = t.sliceDoc(o, o + ae), l = /\s*$/.exec(i)[0].length, a = /^\s*/.exec(s)[0].length, c = i.length - l;
  if (i.slice(c - e.length, c) == e && s.slice(a, a + r.length) == r)
    return {
      open: { pos: n - l, margin: l && 1 },
      close: { pos: o + a, margin: a && 1 }
    };
  let u, h;
  o - n <= 2 * ae ? u = h = t.sliceDoc(n, o) : (u = t.sliceDoc(n, n + ae), h = t.sliceDoc(o - ae, o));
  let m = /^\s*/.exec(u)[0].length, k = /\s*$/.exec(h)[0].length, C = h.length - k - r.length;
  return u.slice(m, m + e.length) == e && h.slice(C, C + r.length) == r ? {
    open: {
      pos: n + m + e.length,
      margin: /\s/.test(u.charAt(m + e.length)) ? 1 : 0
    },
    close: {
      pos: o - k - r.length,
      margin: /\s/.test(h.charAt(C - 1)) ? 1 : 0
    }
  } : null;
}
function Er(t) {
  let e = [];
  for (let r of t.selection.ranges) {
    let n = t.doc.lineAt(r.from), o = r.to <= n.to ? n : t.doc.lineAt(r.to), i = e.length - 1;
    i >= 0 && e[i].to > n.from ? e[i].to = o.to : e.push({ from: n.from + /^\s*/.exec(n.text)[0].length, to: o.to });
  }
  return e;
}
function qt(t, e, r = e.selection.ranges) {
  let n = r.map((i) => rt(e, i.from).block);
  if (!n.every((i) => i))
    return null;
  let o = r.map((i, s) => Dr(e, n[s], i.from, i.to));
  if (t != 2 && !o.every((i) => i))
    return { changes: e.changes(r.map((i, s) => o[s] ? [] : [{ from: i.from, insert: n[s].open + " " }, { from: i.to, insert: " " + n[s].close }])) };
  if (t != 1 && o.some((i) => i)) {
    let i = [];
    for (let s = 0, l; s < o.length; s++)
      if (l = o[s]) {
        let a = n[s], { open: c, close: u } = l;
        i.push({ from: c.pos - a.open.length, to: c.pos + c.margin }, { from: u.pos - u.margin, to: u.pos + a.close.length });
      }
    return { changes: i };
  }
  return null;
}
function Rr(t, e, r = e.selection.ranges) {
  let n = [], o = -1;
  for (let { from: i, to: s } of r) {
    let l = n.length, a = 1e9, c = rt(e, i).line;
    if (c) {
      for (let u = i; u <= s; ) {
        let h = e.doc.lineAt(u);
        if (h.from > o && (i == s || s > h.from)) {
          o = h.from;
          let m = /^\s*/.exec(h.text)[0].length, k = m == h.length, C = h.text.slice(m, m + c.length) == c ? m : -1;
          m < h.text.length && m < a && (a = m), n.push({ line: h, comment: C, token: c, indent: m, empty: k, single: !1 });
        }
        u = h.to + 1;
      }
      if (a < 1e9)
        for (let u = l; u < n.length; u++)
          n[u].indent < n[u].line.text.length && (n[u].indent = a);
      n.length == l + 1 && (n[l].single = !0);
    }
  }
  if (t != 2 && n.some((i) => i.comment < 0 && (!i.empty || i.single))) {
    let i = [];
    for (let { line: l, token: a, indent: c, empty: u, single: h } of n)
      (h || !u) && i.push({ from: l.from + c, insert: a + " " });
    let s = e.changes(i);
    return { changes: s, selection: e.selection.map(s, 1) };
  } else if (t != 1 && n.some((i) => i.comment >= 0)) {
    let i = [];
    for (let { line: s, comment: l, token: a } of n)
      if (l >= 0) {
        let c = s.from + l, u = c + a.length;
        s.text[u - s.from] == " " && u++, i.push({ from: c, to: u });
      }
    return { changes: i };
  }
  return null;
}
const Ge = /* @__PURE__ */ Xe.define(), wr = /* @__PURE__ */ Xe.define(), Tr = /* @__PURE__ */ de.define(), Ht = /* @__PURE__ */ de.define({
  combine(t) {
    return Ee(t, {
      minDepth: 100,
      newGroupDelay: 500,
      joinToEvent: (e, r) => r
    }, {
      minDepth: Math.max,
      newGroupDelay: Math.min,
      joinToEvent: (e, r) => (n, o) => e(n, o) || r(n, o)
    });
  }
});
function Or(t) {
  let e = 0;
  return t.iterChangedRanges((r, n) => e = n), e;
}
const Vt = /* @__PURE__ */ Re.define({
  create() {
    return O.empty;
  },
  update(t, e) {
    let r = e.state.facet(Ht), n = e.annotation(Ge);
    if (n) {
      let a = e.docChanged ? d.single(Or(e.changes)) : void 0, c = v.fromTransaction(e, a), u = n.side, h = u == 0 ? t.undone : t.done;
      return c ? h = Ce(h, h.length, r.minDepth, c) : h = $t(h, e.startState.selection), new O(u == 0 ? n.rest : h, u == 0 ? h : n.rest);
    }
    let o = e.annotation(wr);
    if ((o == "full" || o == "before") && (t = t.isolate()), e.annotation(_e.addToHistory) === !1)
      return e.changes.empty ? t : t.addMapping(e.changes.desc);
    let i = v.fromTransaction(e), s = e.annotation(_e.time), l = e.annotation(_e.userEvent);
    return i ? t = t.addChanges(i, s, l, r, e) : e.selection && (t = t.addSelection(e.startState.selection, s, l, r.newGroupDelay)), (o == "full" || o == "after") && (t = t.isolate()), t;
  },
  toJSON(t) {
    return { done: t.done.map((e) => e.toJSON()), undone: t.undone.map((e) => e.toJSON()) };
  },
  fromJSON(t) {
    return new O(t.done.map(v.fromJSON), t.undone.map(v.fromJSON));
  }
});
function Ir(t = {}) {
  return [
    Vt,
    Ht.of(t),
    p.domEventHandlers({
      beforeinput(e, r) {
        let n = e.inputType == "historyUndo" ? zt : e.inputType == "historyRedo" ? Ke : null;
        return n ? (e.preventDefault(), n(r)) : !1;
      }
    })
  ];
}
function we(t, e) {
  return function({ state: r, dispatch: n }) {
    if (!e && r.readOnly)
      return !1;
    let o = r.field(Vt, !1);
    if (!o)
      return !1;
    let i = o.pop(t, r, e);
    return i ? (n(i), !0) : !1;
  };
}
const zt = /* @__PURE__ */ we(0, !1), Ke = /* @__PURE__ */ we(1, !1), Pr = /* @__PURE__ */ we(0, !0), Wr = /* @__PURE__ */ we(1, !0);
class v {
  constructor(e, r, n, o, i) {
    this.changes = e, this.effects = r, this.mapped = n, this.startSelection = o, this.selectionsAfter = i;
  }
  setSelAfter(e) {
    return new v(this.changes, this.effects, this.mapped, this.startSelection, e);
  }
  toJSON() {
    var e, r, n;
    return {
      changes: (e = this.changes) === null || e === void 0 ? void 0 : e.toJSON(),
      mapped: (r = this.mapped) === null || r === void 0 ? void 0 : r.toJSON(),
      startSelection: (n = this.startSelection) === null || n === void 0 ? void 0 : n.toJSON(),
      selectionsAfter: this.selectionsAfter.map((o) => o.toJSON())
    };
  }
  static fromJSON(e) {
    return new v(e.changes && Jn.fromJSON(e.changes), [], e.mapped && jn.fromJSON(e.mapped), e.startSelection && d.fromJSON(e.startSelection), e.selectionsAfter.map(d.fromJSON));
  }
  // This does not check `addToHistory` and such, it assumes the
  // transaction needs to be converted to an item. Returns null when
  // there are no changes or effects in the transaction.
  static fromTransaction(e, r) {
    let n = B;
    for (let o of e.startState.facet(Tr)) {
      let i = o(e);
      i.length && (n = n.concat(i));
    }
    return !n.length && e.changes.empty ? null : new v(e.changes.invert(e.startState.doc), n, void 0, r || e.startState.selection, B);
  }
  static selection(e) {
    return new v(void 0, B, void 0, void 0, e);
  }
}
function Ce(t, e, r, n) {
  let o = e + 1 > r + 20 ? e - r - 1 : 0, i = t.slice(o, e);
  return i.push(n), i;
}
function Fr(t, e) {
  let r = [], n = !1;
  return t.iterChangedRanges((o, i) => r.push(o, i)), e.iterChangedRanges((o, i, s, l) => {
    for (let a = 0; a < r.length; ) {
      let c = r[a++], u = r[a++];
      l >= c && s <= u && (n = !0);
    }
  }), n;
}
function Nr(t, e) {
  return t.ranges.length == e.ranges.length && t.ranges.filter((r, n) => r.empty != e.ranges[n].empty).length === 0;
}
function Ut(t, e) {
  return t.length ? e.length ? t.concat(e) : t : e;
}
const B = [], _r = 200;
function $t(t, e) {
  if (t.length) {
    let r = t[t.length - 1], n = r.selectionsAfter.slice(Math.max(0, r.selectionsAfter.length - _r));
    return n.length && n[n.length - 1].eq(e) ? t : (n.push(e), Ce(t, t.length - 1, 1e9, r.setSelAfter(n)));
  } else
    return [v.selection([e])];
}
function qr(t) {
  let e = t[t.length - 1], r = t.slice();
  return r[t.length - 1] = e.setSelAfter(e.selectionsAfter.slice(0, e.selectionsAfter.length - 1)), r;
}
function qe(t, e) {
  if (!t.length)
    return t;
  let r = t.length, n = B;
  for (; r; ) {
    let o = Hr(t[r - 1], e, n);
    if (o.changes && !o.changes.empty || o.effects.length) {
      let i = t.slice(0, r);
      return i[r - 1] = o, i;
    } else
      e = o.mapped, r--, n = o.selectionsAfter;
  }
  return n.length ? [v.selection(n)] : B;
}
function Hr(t, e, r) {
  let n = Ut(t.selectionsAfter.length ? t.selectionsAfter.map((l) => l.map(e)) : B, r);
  if (!t.changes)
    return v.selection(n);
  let o = t.changes.map(e), i = e.mapDesc(t.changes, !0), s = t.mapped ? t.mapped.composeDesc(i) : i;
  return new v(o, w.mapEffects(t.effects, e), s, t.startSelection.map(i), n);
}
const Vr = /^(input\.type|delete)($|\.)/;
class O {
  constructor(e, r, n = 0, o = void 0) {
    this.done = e, this.undone = r, this.prevTime = n, this.prevUserEvent = o;
  }
  isolate() {
    return this.prevTime ? new O(this.done, this.undone) : this;
  }
  addChanges(e, r, n, o, i) {
    let s = this.done, l = s[s.length - 1];
    return l && l.changes && !l.changes.empty && e.changes && (!n || Vr.test(n)) && (!l.selectionsAfter.length && r - this.prevTime < o.newGroupDelay && o.joinToEvent(i, Fr(l.changes, e.changes)) || // For compose (but not compose.start) events, always join with previous event
    n == "input.type.compose") ? s = Ce(s, s.length - 1, o.minDepth, new v(e.changes.compose(l.changes), Ut(e.effects, l.effects), l.mapped, l.startSelection, B)) : s = Ce(s, s.length, o.minDepth, e), new O(s, B, r, n);
  }
  addSelection(e, r, n, o) {
    let i = this.done.length ? this.done[this.done.length - 1].selectionsAfter : B;
    return i.length > 0 && r - this.prevTime < o && n == this.prevUserEvent && n && /^select($|\.)/.test(n) && Nr(i[i.length - 1], e) ? this : new O($t(this.done, e), this.undone, r, n);
  }
  addMapping(e) {
    return new O(qe(this.done, e), qe(this.undone, e), this.prevTime, this.prevUserEvent);
  }
  pop(e, r, n) {
    let o = e == 0 ? this.done : this.undone;
    if (o.length == 0)
      return null;
    let i = o[o.length - 1];
    if (n && i.selectionsAfter.length)
      return r.update({
        selection: i.selectionsAfter[i.selectionsAfter.length - 1],
        annotations: Ge.of({ side: e, rest: qr(o) }),
        userEvent: e == 0 ? "select.undo" : "select.redo",
        scrollIntoView: !0
      });
    if (i.changes) {
      let s = o.length == 1 ? B : o.slice(0, o.length - 1);
      return i.mapped && (s = qe(s, i.mapped)), r.update({
        changes: i.changes,
        selection: i.startSelection,
        effects: i.effects,
        annotations: Ge.of({ side: e, rest: s }),
        filter: !1,
        userEvent: e == 0 ? "undo" : "redo",
        scrollIntoView: !0
      });
    } else
      return null;
  }
}
O.empty = /* @__PURE__ */ new O(B, B);
const zr = [
  { key: "Mod-z", run: zt, preventDefault: !0 },
  { key: "Mod-y", mac: "Mod-Shift-z", run: Ke, preventDefault: !0 },
  { linux: "Ctrl-Shift-z", run: Ke, preventDefault: !0 },
  { key: "Mod-u", run: Pr, preventDefault: !0 },
  { key: "Alt-u", mac: "Mod-Shift-u", run: Wr, preventDefault: !0 }
];
function re(t, e) {
  return d.create(t.ranges.map(e), t.mainIndex);
}
function I(t, e) {
  return t.update({ selection: e, scrollIntoView: !0, userEvent: "select" });
}
function T({ state: t, dispatch: e }, r) {
  let n = re(t.selection, r);
  return n.eq(t.selection) ? !1 : (e(I(t, n)), !0);
}
function Te(t, e) {
  return d.cursor(e ? t.to : t.from);
}
function Gt(t, e) {
  return T(t, (r) => r.empty ? t.moveByChar(r, e) : Te(r, e));
}
function S(t) {
  return t.textDirectionAt(t.state.selection.main.head) == Qn.LTR;
}
const Kt = (t) => Gt(t, !S(t)), Jt = (t) => Gt(t, S(t));
function jt(t, e) {
  return T(t, (r) => r.empty ? t.moveByGroup(r, e) : Te(r, e));
}
const Ur = (t) => jt(t, !S(t)), $r = (t) => jt(t, S(t));
function Gr(t, e, r) {
  if (e.type.prop(r))
    return !0;
  let n = e.to - e.from;
  return n && (n > 2 || /[^\s,.;:]/.test(t.sliceDoc(e.from, e.to))) || e.firstChild;
}
function Oe(t, e, r) {
  let n = et(t).resolveInner(e.head), o = r ? $e.closedBy : $e.openedBy;
  for (let a = e.head; ; ) {
    let c = r ? n.childAfter(a) : n.childBefore(a);
    if (!c)
      break;
    Gr(t, c, o) ? n = c : a = r ? c.to : c.from;
  }
  let i = n.type.prop(o), s, l;
  return i && (s = r ? Z(t, n.from, 1) : Z(t, n.to, -1)) && s.matched ? l = r ? s.end.to : s.end.from : l = r ? n.to : n.from, d.cursor(l, r ? -1 : 1);
}
const Kr = (t) => T(t, (e) => Oe(t.state, e, !S(t))), Jr = (t) => T(t, (e) => Oe(t.state, e, S(t)));
function Qt(t, e) {
  return T(t, (r) => {
    if (!r.empty)
      return Te(r, e);
    let n = t.moveVertically(r, e);
    return n.head != r.head ? n : t.moveToLineBoundary(r, e);
  });
}
const Yt = (t) => Qt(t, !1), Zt = (t) => Qt(t, !0);
function Xt(t) {
  let e = t.scrollDOM.clientHeight < t.scrollDOM.scrollHeight - 2, r = 0, n = 0, o;
  if (e) {
    for (let i of t.state.facet(p.scrollMargins)) {
      let s = i(t);
      s != null && s.top && (r = Math.max(s == null ? void 0 : s.top, r)), s != null && s.bottom && (n = Math.max(s == null ? void 0 : s.bottom, n));
    }
    o = t.scrollDOM.clientHeight - r - n;
  } else
    o = (t.dom.ownerDocument.defaultView || window).innerHeight;
  return {
    marginTop: r,
    marginBottom: n,
    selfScroll: e,
    height: Math.max(t.defaultLineHeight, o - 5)
  };
}
function en(t, e) {
  let r = Xt(t), { state: n } = t, o = re(n.selection, (s) => s.empty ? t.moveVertically(s, e, r.height) : Te(s, e));
  if (o.eq(n.selection))
    return !1;
  let i;
  if (r.selfScroll) {
    let s = t.coordsAtPos(n.selection.main.head), l = t.scrollDOM.getBoundingClientRect(), a = l.top + r.marginTop, c = l.bottom - r.marginBottom;
    s && s.top > a && s.bottom < c && (i = p.scrollIntoView(o.main.head, { y: "start", yMargin: s.top - a }));
  }
  return t.dispatch(I(n, o), { effects: i }), !0;
}
const ut = (t) => en(t, !1), Je = (t) => en(t, !0);
function H(t, e, r) {
  let n = t.lineBlockAt(e.head), o = t.moveToLineBoundary(e, r);
  if (o.head == e.head && o.head != (r ? n.to : n.from) && (o = t.moveToLineBoundary(e, r, !1)), !r && o.head == n.from && n.length) {
    let i = /^\s*/.exec(t.state.sliceDoc(n.from, Math.min(n.from + 100, n.to)))[0].length;
    i && e.head != n.from + i && (o = d.cursor(n.from + i));
  }
  return o;
}
const jr = (t) => T(t, (e) => H(t, e, !0)), Qr = (t) => T(t, (e) => H(t, e, !1)), Yr = (t) => T(t, (e) => H(t, e, !S(t))), Zr = (t) => T(t, (e) => H(t, e, S(t))), Xr = (t) => T(t, (e) => d.cursor(t.lineBlockAt(e.head).from, 1)), eo = (t) => T(t, (e) => d.cursor(t.lineBlockAt(e.head).to, -1));
function to(t, e, r) {
  let n = !1, o = re(t.selection, (i) => {
    let s = Z(t, i.head, -1) || Z(t, i.head, 1) || i.head > 0 && Z(t, i.head - 1, 1) || i.head < t.doc.length && Z(t, i.head + 1, -1);
    if (!s || !s.end)
      return i;
    n = !0;
    let l = s.start.from == i.head ? s.end.to : s.end.from;
    return r ? d.range(i.anchor, l) : d.cursor(l);
  });
  return n ? (e(I(t, o)), !0) : !1;
}
const no = ({ state: t, dispatch: e }) => to(t, e, !1);
function D(t, e) {
  let r = re(t.state.selection, (n) => {
    let o = e(n);
    return d.range(n.anchor, o.head, o.goalColumn, o.bidiLevel || void 0);
  });
  return r.eq(t.state.selection) ? !1 : (t.dispatch(I(t.state, r)), !0);
}
function tn(t, e) {
  return D(t, (r) => t.moveByChar(r, e));
}
const nn = (t) => tn(t, !S(t)), rn = (t) => tn(t, S(t));
function on(t, e) {
  return D(t, (r) => t.moveByGroup(r, e));
}
const ro = (t) => on(t, !S(t)), oo = (t) => on(t, S(t)), io = (t) => D(t, (e) => Oe(t.state, e, !S(t))), so = (t) => D(t, (e) => Oe(t.state, e, S(t)));
function sn(t, e) {
  return D(t, (r) => t.moveVertically(r, e));
}
const ln = (t) => sn(t, !1), an = (t) => sn(t, !0);
function cn(t, e) {
  return D(t, (r) => t.moveVertically(r, e, Xt(t).height));
}
const ht = (t) => cn(t, !1), ft = (t) => cn(t, !0), lo = (t) => D(t, (e) => H(t, e, !0)), ao = (t) => D(t, (e) => H(t, e, !1)), co = (t) => D(t, (e) => H(t, e, !S(t))), uo = (t) => D(t, (e) => H(t, e, S(t))), ho = (t) => D(t, (e) => d.cursor(t.lineBlockAt(e.head).from)), fo = (t) => D(t, (e) => d.cursor(t.lineBlockAt(e.head).to)), dt = ({ state: t, dispatch: e }) => (e(I(t, { anchor: 0 })), !0), mt = ({ state: t, dispatch: e }) => (e(I(t, { anchor: t.doc.length })), !0), gt = ({ state: t, dispatch: e }) => (e(I(t, { anchor: t.selection.main.anchor, head: 0 })), !0), pt = ({ state: t, dispatch: e }) => (e(I(t, { anchor: t.selection.main.anchor, head: t.doc.length })), !0), mo = ({ state: t, dispatch: e }) => (e(t.update({ selection: { anchor: 0, head: t.doc.length }, userEvent: "select" })), !0), go = ({ state: t, dispatch: e }) => {
  let r = Pe(t).map(({ from: n, to: o }) => d.range(n, Math.min(o + 1, t.doc.length)));
  return e(t.update({ selection: d.create(r), userEvent: "select" })), !0;
}, po = ({ state: t, dispatch: e }) => {
  let r = re(t.selection, (n) => {
    var o;
    let i = et(t).resolveInner(n.head, 1);
    for (; !(i.from < n.from && i.to >= n.to || i.to > n.to && i.from <= n.from || !(!((o = i.parent) === null || o === void 0) && o.parent)); )
      i = i.parent;
    return d.range(i.to, i.from);
  });
  return e(I(t, r)), !0;
}, yo = ({ state: t, dispatch: e }) => {
  let r = t.selection, n = null;
  return r.ranges.length > 1 ? n = d.create([r.main]) : r.main.empty || (n = d.create([d.cursor(r.main.head)])), n ? (e(I(t, n)), !0) : !1;
};
function Ie(t, e) {
  if (t.state.readOnly)
    return !1;
  let r = "delete.selection", { state: n } = t, o = n.changeByRange((i) => {
    let { from: s, to: l } = i;
    if (s == l) {
      let a = e(s);
      a < s ? (r = "delete.backward", a = pe(t, a, !1)) : a > s && (r = "delete.forward", a = pe(t, a, !0)), s = Math.min(s, a), l = Math.max(l, a);
    } else
      s = pe(t, s, !1), l = pe(t, l, !0);
    return s == l ? { range: i } : { changes: { from: s, to: l }, range: d.cursor(s) };
  });
  return o.changes.empty ? !1 : (t.dispatch(n.update(o, {
    scrollIntoView: !0,
    userEvent: r,
    effects: r == "delete.selection" ? p.announce.of(n.phrase("Selection deleted")) : void 0
  })), !0);
}
function pe(t, e, r) {
  if (t instanceof p)
    for (let n of t.state.facet(p.atomicRanges).map((o) => o(t)))
      n.between(e, e, (o, i) => {
        o < e && i > e && (e = r ? i : o);
      });
  return e;
}
const un = (t, e) => Ie(t, (r) => {
  let { state: n } = t, o = n.doc.lineAt(r), i, s;
  if (!e && r > o.from && r < o.from + 200 && !/[^ \t]/.test(i = o.text.slice(0, r - o.from))) {
    if (i[i.length - 1] == "	")
      return r - 1;
    let l = Wt(i, n.tabSize), a = l % Ue(n) || Ue(n);
    for (let c = 0; c < a && i[i.length - 1 - c] == " "; c++)
      r--;
    s = r;
  } else
    s = ee(o.text, r - o.from, e, e) + o.from, s == r && o.number != (e ? n.doc.lines : 1) && (s += e ? 1 : -1);
  return s;
}), je = (t) => un(t, !1), hn = (t) => un(t, !0), fn = (t, e) => Ie(t, (r) => {
  let n = r, { state: o } = t, i = o.doc.lineAt(n), s = o.charCategorizer(n);
  for (let l = null; ; ) {
    if (n == (e ? i.to : i.from)) {
      n == r && i.number != (e ? o.doc.lines : 1) && (n += e ? 1 : -1);
      break;
    }
    let a = ee(i.text, n - i.from, e) + i.from, c = i.text.slice(Math.min(n, a) - i.from, Math.max(n, a) - i.from), u = s(c);
    if (l != null && u != l)
      break;
    (c != " " || n != r) && (l = u), n = a;
  }
  return n;
}), dn = (t) => fn(t, !1), xo = (t) => fn(t, !0), mn = (t) => Ie(t, (e) => {
  let r = t.lineBlockAt(e).to;
  return e < r ? r : Math.min(t.state.doc.length, e + 1);
}), ko = (t) => Ie(t, (e) => {
  let r = t.lineBlockAt(e).from;
  return e > r ? r : Math.max(0, e - 1);
}), bo = ({ state: t, dispatch: e }) => {
  if (t.readOnly)
    return !1;
  let r = t.changeByRange((n) => ({
    changes: { from: n.from, to: n.to, insert: It.of(["", ""]) },
    range: d.cursor(n.from)
  }));
  return e(t.update(r, { scrollIntoView: !0, userEvent: "input" })), !0;
}, So = ({ state: t, dispatch: e }) => {
  if (t.readOnly)
    return !1;
  let r = t.changeByRange((n) => {
    if (!n.empty || n.from == 0 || n.from == t.doc.length)
      return { range: n };
    let o = n.from, i = t.doc.lineAt(o), s = o == i.from ? o - 1 : ee(i.text, o - i.from, !1) + i.from, l = o == i.to ? o + 1 : ee(i.text, o - i.from, !0) + i.from;
    return {
      changes: { from: s, to: l, insert: t.doc.slice(o, l).append(t.doc.slice(s, o)) },
      range: d.cursor(l)
    };
  });
  return r.changes.empty ? !1 : (e(t.update(r, { scrollIntoView: !0, userEvent: "move.character" })), !0);
};
function Pe(t) {
  let e = [], r = -1;
  for (let n of t.selection.ranges) {
    let o = t.doc.lineAt(n.from), i = t.doc.lineAt(n.to);
    if (!n.empty && n.to == i.from && (i = t.doc.lineAt(n.to - 1)), r >= o.number) {
      let s = e[e.length - 1];
      s.to = i.to, s.ranges.push(n);
    } else
      e.push({ from: o.from, to: i.to, ranges: [n] });
    r = i.number + 1;
  }
  return e;
}
function gn(t, e, r) {
  if (t.readOnly)
    return !1;
  let n = [], o = [];
  for (let i of Pe(t)) {
    if (r ? i.to == t.doc.length : i.from == 0)
      continue;
    let s = t.doc.lineAt(r ? i.to + 1 : i.from - 1), l = s.length + 1;
    if (r) {
      n.push({ from: i.to, to: s.to }, { from: i.from, insert: s.text + t.lineBreak });
      for (let a of i.ranges)
        o.push(d.range(Math.min(t.doc.length, a.anchor + l), Math.min(t.doc.length, a.head + l)));
    } else {
      n.push({ from: s.from, to: i.from }, { from: i.to, insert: t.lineBreak + s.text });
      for (let a of i.ranges)
        o.push(d.range(a.anchor - l, a.head - l));
    }
  }
  return n.length ? (e(t.update({
    changes: n,
    scrollIntoView: !0,
    selection: d.create(o, t.selection.mainIndex),
    userEvent: "move.line"
  })), !0) : !1;
}
const Co = ({ state: t, dispatch: e }) => gn(t, e, !1), vo = ({ state: t, dispatch: e }) => gn(t, e, !0);
function pn(t, e, r) {
  if (t.readOnly)
    return !1;
  let n = [];
  for (let o of Pe(t))
    r ? n.push({ from: o.from, insert: t.doc.slice(o.from, o.to) + t.lineBreak }) : n.push({ from: o.to, insert: t.lineBreak + t.doc.slice(o.from, o.to) });
  return e(t.update({ changes: n, scrollIntoView: !0, userEvent: "input.copyline" })), !0;
}
const Ao = ({ state: t, dispatch: e }) => pn(t, e, !1), Mo = ({ state: t, dispatch: e }) => pn(t, e, !0), Lo = (t) => {
  if (t.state.readOnly)
    return !1;
  let { state: e } = t, r = e.changes(Pe(e).map(({ from: o, to: i }) => (o > 0 ? o-- : i < e.doc.length && i++, { from: o, to: i }))), n = re(e.selection, (o) => t.moveVertically(o, !0)).map(r);
  return t.dispatch({ changes: r, selection: n, scrollIntoView: !0, userEvent: "delete.line" }), !0;
};
function Bo(t, e) {
  if (/\(\)|\[\]|\{\}/.test(t.sliceDoc(e - 1, e + 1)))
    return { from: e, to: e };
  let r = et(t).resolveInner(e), n = r.childBefore(e), o = r.childAfter(e), i;
  return n && o && n.to <= e && o.from >= e && (i = n.type.prop($e.closedBy)) && i.indexOf(o.name) > -1 && t.doc.lineAt(n.to).from == t.doc.lineAt(o.from).from ? { from: n.to, to: o.from } : null;
}
const Do = /* @__PURE__ */ yn(!1), Eo = /* @__PURE__ */ yn(!0);
function yn(t) {
  return ({ state: e, dispatch: r }) => {
    if (e.readOnly)
      return !1;
    let n = e.changeByRange((o) => {
      let { from: i, to: s } = o, l = e.doc.lineAt(i), a = !t && i == s && Bo(e, i);
      t && (i = s = (s <= l.to ? l : e.doc.lineAt(s)).to);
      let c = new Tt(e, { simulateBreak: i, simulateDoubleBreak: !!a }), u = Ot(c, i);
      for (u == null && (u = /^\s*/.exec(e.doc.lineAt(i).text)[0].length); s < l.to && /\s/.test(l.text[s - l.from]); )
        s++;
      a ? { from: i, to: s } = a : i > l.from && i < l.from + 100 && !/\S/.test(l.text.slice(0, i)) && (i = l.from);
      let h = ["", Se(e, u)];
      return a && h.push(Se(e, c.lineIndent(l.from, -1))), {
        changes: { from: i, to: s, insert: It.of(h) },
        range: d.cursor(i + 1 + h[1].length)
      };
    });
    return r(e.update(n, { scrollIntoView: !0, userEvent: "input" })), !0;
  };
}
function ot(t, e) {
  let r = -1;
  return t.changeByRange((n) => {
    let o = [];
    for (let s = n.from; s <= n.to; ) {
      let l = t.doc.lineAt(s);
      l.number > r && (n.empty || n.to > l.from) && (e(l, o, n), r = l.number), s = l.to + 1;
    }
    let i = t.changes(o);
    return {
      changes: o,
      range: d.range(i.mapPos(n.anchor, 1), i.mapPos(n.head, 1))
    };
  });
}
const Ro = ({ state: t, dispatch: e }) => {
  if (t.readOnly)
    return !1;
  let r = /* @__PURE__ */ Object.create(null), n = new Tt(t, { overrideIndentation: (i) => {
    let s = r[i];
    return s ?? -1;
  } }), o = ot(t, (i, s, l) => {
    let a = Ot(n, i.from);
    if (a == null)
      return;
    /\S/.test(i.text) || (a = 0);
    let c = /^\s*/.exec(i.text)[0], u = Se(t, a);
    (c != u || l.from < i.from + c.length) && (r[i.from] = a, s.push({ from: i.from, to: i.from + c.length, insert: u }));
  });
  return o.changes.empty || e(t.update(o, { userEvent: "indent" })), !0;
}, xn = ({ state: t, dispatch: e }) => t.readOnly ? !1 : (e(t.update(ot(t, (r, n) => {
  n.push({ from: r.from, insert: t.facet(Pt) });
}), { userEvent: "input.indent" })), !0), kn = ({ state: t, dispatch: e }) => t.readOnly ? !1 : (e(t.update(ot(t, (r, n) => {
  let o = /^\s*/.exec(r.text)[0];
  if (!o)
    return;
  let i = Wt(o, t.tabSize), s = 0, l = Se(t, Math.max(0, i - Ue(t)));
  for (; s < o.length && s < l.length && o.charCodeAt(s) == l.charCodeAt(s); )
    s++;
  n.push({ from: r.from + s, to: r.from + o.length, insert: l.slice(s) });
}), { userEvent: "delete.dedent" })), !0), wo = [
  { key: "Ctrl-b", run: Kt, shift: nn, preventDefault: !0 },
  { key: "Ctrl-f", run: Jt, shift: rn },
  { key: "Ctrl-p", run: Yt, shift: ln },
  { key: "Ctrl-n", run: Zt, shift: an },
  { key: "Ctrl-a", run: Xr, shift: ho },
  { key: "Ctrl-e", run: eo, shift: fo },
  { key: "Ctrl-d", run: hn },
  { key: "Ctrl-h", run: je },
  { key: "Ctrl-k", run: mn },
  { key: "Ctrl-Alt-h", run: dn },
  { key: "Ctrl-o", run: bo },
  { key: "Ctrl-t", run: So },
  { key: "Ctrl-v", run: Je }
], To = /* @__PURE__ */ [
  { key: "ArrowLeft", run: Kt, shift: nn, preventDefault: !0 },
  { key: "Mod-ArrowLeft", mac: "Alt-ArrowLeft", run: Ur, shift: ro, preventDefault: !0 },
  { mac: "Cmd-ArrowLeft", run: Yr, shift: co, preventDefault: !0 },
  { key: "ArrowRight", run: Jt, shift: rn, preventDefault: !0 },
  { key: "Mod-ArrowRight", mac: "Alt-ArrowRight", run: $r, shift: oo, preventDefault: !0 },
  { mac: "Cmd-ArrowRight", run: Zr, shift: uo, preventDefault: !0 },
  { key: "ArrowUp", run: Yt, shift: ln, preventDefault: !0 },
  { mac: "Cmd-ArrowUp", run: dt, shift: gt },
  { mac: "Ctrl-ArrowUp", run: ut, shift: ht },
  { key: "ArrowDown", run: Zt, shift: an, preventDefault: !0 },
  { mac: "Cmd-ArrowDown", run: mt, shift: pt },
  { mac: "Ctrl-ArrowDown", run: Je, shift: ft },
  { key: "PageUp", run: ut, shift: ht },
  { key: "PageDown", run: Je, shift: ft },
  { key: "Home", run: Qr, shift: ao, preventDefault: !0 },
  { key: "Mod-Home", run: dt, shift: gt },
  { key: "End", run: jr, shift: lo, preventDefault: !0 },
  { key: "Mod-End", run: mt, shift: pt },
  { key: "Enter", run: Do },
  { key: "Mod-a", run: mo },
  { key: "Backspace", run: je, shift: je },
  { key: "Delete", run: hn },
  { key: "Mod-Backspace", mac: "Alt-Backspace", run: dn },
  { key: "Mod-Delete", mac: "Alt-Delete", run: xo },
  { mac: "Mod-Backspace", run: ko },
  { mac: "Mod-Delete", run: mn }
].concat(/* @__PURE__ */ wo.map((t) => ({ mac: t.key, run: t.run, shift: t.shift }))), Oo = /* @__PURE__ */ [
  { key: "Alt-ArrowLeft", mac: "Ctrl-ArrowLeft", run: Kr, shift: io },
  { key: "Alt-ArrowRight", mac: "Ctrl-ArrowRight", run: Jr, shift: so },
  { key: "Alt-ArrowUp", run: Co },
  { key: "Shift-Alt-ArrowUp", run: Ao },
  { key: "Alt-ArrowDown", run: vo },
  { key: "Shift-Alt-ArrowDown", run: Mo },
  { key: "Escape", run: yo },
  { key: "Mod-Enter", run: Eo },
  { key: "Alt-l", mac: "Ctrl-l", run: go },
  { key: "Mod-i", run: po, preventDefault: !0 },
  { key: "Mod-[", run: kn },
  { key: "Mod-]", run: xn },
  { key: "Mod-Alt-\\", run: Ro },
  { key: "Shift-Mod-k", run: Lo },
  { key: "Shift-Mod-\\", run: no },
  { key: "Mod-/", run: Ar },
  { key: "Alt-A", run: Lr }
].concat(To), Io = { key: "Tab", run: xn, shift: kn };
function g() {
  var t = arguments[0];
  typeof t == "string" && (t = document.createElement(t));
  var e = 1, r = arguments[1];
  if (r && typeof r == "object" && r.nodeType == null && !Array.isArray(r)) {
    for (var n in r)
      if (Object.prototype.hasOwnProperty.call(r, n)) {
        var o = r[n];
        typeof o == "string" ? t.setAttribute(n, o) : o != null && (t[n] = o);
      }
    e++;
  }
  for (; e < arguments.length; e++)
    bn(t, arguments[e]);
  return t;
}
function bn(t, e) {
  if (typeof e == "string")
    t.appendChild(document.createTextNode(e));
  else if (e != null)
    if (e.nodeType != null)
      t.appendChild(e);
    else if (Array.isArray(e))
      for (var r = 0; r < e.length; r++)
        bn(t, e[r]);
    else
      throw new RangeError("Unsupported child node: " + e);
}
const yt = typeof String.prototype.normalize == "function" ? (t) => t.normalize("NFKD") : (t) => t;
class te {
  /**
  Create a text cursor. The query is the search string, `from` to
  `to` provides the region to search.
  
  When `normalize` is given, it will be called, on both the query
  string and the content it is matched against, before comparing.
  You can, for example, create a case-insensitive search by
  passing `s => s.toLowerCase()`.
  
  Text is always normalized with
  [`.normalize("NFKD")`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize)
  (when supported).
  */
  constructor(e, r, n = 0, o = e.length, i, s) {
    this.test = s, this.value = { from: 0, to: 0 }, this.done = !1, this.matches = [], this.buffer = "", this.bufferPos = 0, this.iter = e.iterRange(n, o), this.bufferStart = n, this.normalize = i ? (l) => i(yt(l)) : yt, this.query = this.normalize(r);
  }
  peek() {
    if (this.bufferPos == this.buffer.length) {
      if (this.bufferStart += this.buffer.length, this.iter.next(), this.iter.done)
        return -1;
      this.bufferPos = 0, this.buffer = this.iter.value;
    }
    return Yn(this.buffer, this.bufferPos);
  }
  /**
  Look for the next match. Updates the iterator's
  [`value`](https://codemirror.net/6/docs/ref/#search.SearchCursor.value) and
  [`done`](https://codemirror.net/6/docs/ref/#search.SearchCursor.done) properties. Should be called
  at least once before using the cursor.
  */
  next() {
    for (; this.matches.length; )
      this.matches.pop();
    return this.nextOverlapping();
  }
  /**
  The `next` method will ignore matches that partially overlap a
  previous match. This method behaves like `next`, but includes
  such matches.
  */
  nextOverlapping() {
    for (; ; ) {
      let e = this.peek();
      if (e < 0)
        return this.done = !0, this;
      let r = er(e), n = this.bufferStart + this.bufferPos;
      this.bufferPos += Zn(e);
      let o = this.normalize(r);
      for (let i = 0, s = n; ; i++) {
        let l = o.charCodeAt(i), a = this.match(l, s);
        if (i == o.length - 1) {
          if (a)
            return this.value = a, this;
          break;
        }
        s == n && i < r.length && r.charCodeAt(i) == l && s++;
      }
    }
  }
  match(e, r) {
    let n = null;
    for (let o = 0; o < this.matches.length; o += 2) {
      let i = this.matches[o], s = !1;
      this.query.charCodeAt(i) == e && (i == this.query.length - 1 ? n = { from: this.matches[o + 1], to: r + 1 } : (this.matches[o]++, s = !0)), s || (this.matches.splice(o, 2), o -= 2);
    }
    return this.query.charCodeAt(0) == e && (this.query.length == 1 ? n = { from: r, to: r + 1 } : this.matches.push(1, r)), n && this.test && !this.test(n.from, n.to, this.buffer, this.bufferPos) && (n = null), n;
  }
}
typeof Symbol < "u" && (te.prototype[Symbol.iterator] = function() {
  return this;
});
const Sn = { from: -1, to: -1, match: /* @__PURE__ */ /.*/.exec("") }, it = "gm" + (/x/.unicode == null ? "" : "u");
class Cn {
  /**
  Create a cursor that will search the given range in the given
  document. `query` should be the raw pattern (as you'd pass it to
  `new RegExp`).
  */
  constructor(e, r, n, o = 0, i = e.length) {
    if (this.text = e, this.to = i, this.curLine = "", this.done = !1, this.value = Sn, /\\[sWDnr]|\n|\r|\[\^/.test(r))
      return new vn(e, r, n, o, i);
    this.re = new RegExp(r, it + (n != null && n.ignoreCase ? "i" : "")), this.test = n == null ? void 0 : n.test, this.iter = e.iter();
    let s = e.lineAt(o);
    this.curLineStart = s.from, this.matchPos = ve(e, o), this.getLine(this.curLineStart);
  }
  getLine(e) {
    this.iter.next(e), this.iter.lineBreak ? this.curLine = "" : (this.curLine = this.iter.value, this.curLineStart + this.curLine.length > this.to && (this.curLine = this.curLine.slice(0, this.to - this.curLineStart)), this.iter.next());
  }
  nextLine() {
    this.curLineStart = this.curLineStart + this.curLine.length + 1, this.curLineStart > this.to ? this.curLine = "" : this.getLine(0);
  }
  /**
  Move to the next match, if there is one.
  */
  next() {
    for (let e = this.matchPos - this.curLineStart; ; ) {
      this.re.lastIndex = e;
      let r = this.matchPos <= this.to && this.re.exec(this.curLine);
      if (r) {
        let n = this.curLineStart + r.index, o = n + r[0].length;
        if (this.matchPos = ve(this.text, o + (n == o ? 1 : 0)), n == this.curLineStart + this.curLine.length && this.nextLine(), (n < o || n > this.value.to) && (!this.test || this.test(n, o, r)))
          return this.value = { from: n, to: o, match: r }, this;
        e = this.matchPos - this.curLineStart;
      } else if (this.curLineStart + this.curLine.length < this.to)
        this.nextLine(), e = 0;
      else
        return this.done = !0, this;
    }
  }
}
const He = /* @__PURE__ */ new WeakMap();
class X {
  constructor(e, r) {
    this.from = e, this.text = r;
  }
  get to() {
    return this.from + this.text.length;
  }
  static get(e, r, n) {
    let o = He.get(e);
    if (!o || o.from >= n || o.to <= r) {
      let l = new X(r, e.sliceString(r, n));
      return He.set(e, l), l;
    }
    if (o.from == r && o.to == n)
      return o;
    let { text: i, from: s } = o;
    return s > r && (i = e.sliceString(r, s) + i, s = r), o.to < n && (i += e.sliceString(o.to, n)), He.set(e, new X(s, i)), new X(r, i.slice(r - s, n - s));
  }
}
class vn {
  constructor(e, r, n, o, i) {
    this.text = e, this.to = i, this.done = !1, this.value = Sn, this.matchPos = ve(e, o), this.re = new RegExp(r, it + (n != null && n.ignoreCase ? "i" : "")), this.test = n == null ? void 0 : n.test, this.flat = X.get(e, o, this.chunkEnd(
      o + 5e3
      /* Base */
    ));
  }
  chunkEnd(e) {
    return e >= this.to ? this.to : this.text.lineAt(e).to;
  }
  next() {
    for (; ; ) {
      let e = this.re.lastIndex = this.matchPos - this.flat.from, r = this.re.exec(this.flat.text);
      if (r && !r[0] && r.index == e && (this.re.lastIndex = e + 1, r = this.re.exec(this.flat.text)), r) {
        let n = this.flat.from + r.index, o = n + r[0].length;
        if ((this.flat.to >= this.to || r.index + r[0].length <= this.flat.text.length - 10) && (!this.test || this.test(n, o, r)))
          return this.value = { from: n, to: o, match: r }, this.matchPos = ve(this.text, o + (n == o ? 1 : 0)), this;
      }
      if (this.flat.to == this.to)
        return this.done = !0, this;
      this.flat = X.get(this.text, this.flat.from, this.chunkEnd(this.flat.from + this.flat.text.length * 2));
    }
  }
}
typeof Symbol < "u" && (Cn.prototype[Symbol.iterator] = vn.prototype[Symbol.iterator] = function() {
  return this;
});
function Po(t) {
  try {
    return new RegExp(t, it), !0;
  } catch {
    return !1;
  }
}
function ve(t, e) {
  if (e >= t.length)
    return e;
  let r = t.lineAt(e), n;
  for (; e < r.to && (n = r.text.charCodeAt(e - r.from)) >= 56320 && n < 57344; )
    e++;
  return e;
}
function Qe(t) {
  let e = g("input", { class: "cm-textfield", name: "line" }), r = g("form", {
    class: "cm-gotoLine",
    onkeydown: (o) => {
      o.keyCode == 27 ? (o.preventDefault(), t.dispatch({ effects: Ae.of(!1) }), t.focus()) : o.keyCode == 13 && (o.preventDefault(), n());
    },
    onsubmit: (o) => {
      o.preventDefault(), n();
    }
  }, g("label", t.state.phrase("Go to line"), ": ", e), " ", g("button", { class: "cm-button", type: "submit" }, t.state.phrase("go")));
  function n() {
    let o = /^([+-])?(\d+)?(:\d+)?(%)?$/.exec(e.value);
    if (!o)
      return;
    let { state: i } = t, s = i.doc.lineAt(i.selection.main.head), [, l, a, c, u] = o, h = c ? +c.slice(1) : 0, m = a ? +a : s.number;
    if (a && u) {
      let E = m / 100;
      l && (E = E * (l == "-" ? -1 : 1) + s.number / i.doc.lines), m = Math.round(i.doc.lines * E);
    } else
      a && l && (m = m * (l == "-" ? -1 : 1) + s.number);
    let k = i.doc.line(Math.max(1, Math.min(i.doc.lines, m))), C = d.cursor(k.from + Math.max(0, Math.min(h, k.length)));
    t.dispatch({
      effects: [Ae.of(!1), p.scrollIntoView(C.from, { y: "center" })],
      selection: C
    }), t.focus();
  }
  return { dom: r };
}
const Ae = /* @__PURE__ */ w.define(), xt = /* @__PURE__ */ Re.define({
  create() {
    return !0;
  },
  update(t, e) {
    for (let r of e.effects)
      r.is(Ae) && (t = r.value);
    return t;
  },
  provide: (t) => tt.from(t, (e) => e ? Qe : null)
}), Wo = (t) => {
  let e = ue(t, Qe);
  if (!e) {
    let r = [Ae.of(!0)];
    t.state.field(xt, !1) == null && r.push(w.appendConfig.of([xt, Fo])), t.dispatch({ effects: r }), e = ue(t, Qe);
  }
  return e && e.dom.querySelector("input").focus(), !0;
}, Fo = /* @__PURE__ */ p.baseTheme({
  ".cm-panel.cm-gotoLine": {
    padding: "2px 6px 4px",
    "& label": { fontSize: "80%" }
  }
}), No = {
  highlightWordAroundCursor: !1,
  minSelectionLength: 1,
  maxMatches: 100,
  wholeWords: !1
}, An = /* @__PURE__ */ de.define({
  combine(t) {
    return Ee(t, No, {
      highlightWordAroundCursor: (e, r) => e || r,
      minSelectionLength: Math.min,
      maxMatches: Math.min
    });
  }
});
function _o(t) {
  let e = [Uo, zo];
  return t && e.push(An.of(t)), e;
}
const qo = /* @__PURE__ */ x.mark({ class: "cm-selectionMatch" }), Ho = /* @__PURE__ */ x.mark({ class: "cm-selectionMatch cm-selectionMatch-main" });
function kt(t, e, r, n) {
  return (r == 0 || t(e.sliceDoc(r - 1, r)) != L.Word) && (n == e.doc.length || t(e.sliceDoc(n, n + 1)) != L.Word);
}
function Vo(t, e, r, n) {
  return t(e.sliceDoc(r, r + 1)) == L.Word && t(e.sliceDoc(n - 1, n)) == L.Word;
}
const zo = /* @__PURE__ */ Ft.fromClass(class {
  constructor(t) {
    this.decorations = this.getDeco(t);
  }
  update(t) {
    (t.selectionSet || t.docChanged || t.viewportChanged) && (this.decorations = this.getDeco(t.view));
  }
  getDeco(t) {
    let e = t.state.facet(An), { state: r } = t, n = r.selection;
    if (n.ranges.length > 1)
      return x.none;
    let o = n.main, i, s = null;
    if (o.empty) {
      if (!e.highlightWordAroundCursor)
        return x.none;
      let a = r.wordAt(o.head);
      if (!a)
        return x.none;
      s = r.charCategorizer(o.head), i = r.sliceDoc(a.from, a.to);
    } else {
      let a = o.to - o.from;
      if (a < e.minSelectionLength || a > 200)
        return x.none;
      if (e.wholeWords) {
        if (i = r.sliceDoc(o.from, o.to), s = r.charCategorizer(o.head), !(kt(s, r, o.from, o.to) && Vo(s, r, o.from, o.to)))
          return x.none;
      } else if (i = r.sliceDoc(o.from, o.to).trim(), !i)
        return x.none;
    }
    let l = [];
    for (let a of t.visibleRanges) {
      let c = new te(r.doc, i, a.from, a.to);
      for (; !c.next().done; ) {
        let { from: u, to: h } = c.value;
        if ((!s || kt(s, r, u, h)) && (o.empty && u <= o.from && h >= o.to ? l.push(Ho.range(u, h)) : (u >= o.to || h <= o.from) && l.push(qo.range(u, h)), l.length > e.maxMatches))
          return x.none;
      }
    }
    return x.set(l);
  }
}, {
  decorations: (t) => t.decorations
}), Uo = /* @__PURE__ */ p.baseTheme({
  ".cm-selectionMatch": { backgroundColor: "#99ff7780" },
  ".cm-searchMatch .cm-selectionMatch": { backgroundColor: "transparent" }
}), $o = ({ state: t, dispatch: e }) => {
  let { selection: r } = t, n = d.create(r.ranges.map((o) => t.wordAt(o.head) || d.cursor(o.head)), r.mainIndex);
  return n.eq(r) ? !1 : (e(t.update({ selection: n })), !0);
};
function Go(t, e) {
  let { main: r, ranges: n } = t.selection, o = t.wordAt(r.head), i = o && o.from == r.from && o.to == r.to;
  for (let s = !1, l = new te(t.doc, e, n[n.length - 1].to); ; )
    if (l.next(), l.done) {
      if (s)
        return null;
      l = new te(t.doc, e, 0, Math.max(0, n[n.length - 1].from - 1)), s = !0;
    } else {
      if (s && n.some((a) => a.from == l.value.from))
        continue;
      if (i) {
        let a = t.wordAt(l.value.from);
        if (!a || a.from != l.value.from || a.to != l.value.to)
          continue;
      }
      return l.value;
    }
}
const Ko = ({ state: t, dispatch: e }) => {
  let { ranges: r } = t.selection;
  if (r.some((i) => i.from === i.to))
    return $o({ state: t, dispatch: e });
  let n = t.sliceDoc(r[0].from, r[0].to);
  if (t.selection.ranges.some((i) => t.sliceDoc(i.from, i.to) != n))
    return !1;
  let o = Go(t, n);
  return o ? (e(t.update({
    selection: t.selection.addRange(d.range(o.from, o.to), !1),
    effects: p.scrollIntoView(o.to)
  })), !0) : !1;
}, oe = /* @__PURE__ */ de.define({
  combine(t) {
    return Ee(t, {
      top: !1,
      caseSensitive: !1,
      literal: !1,
      regexp: !1,
      wholeWord: !1,
      createPanel: (e) => new ii(e),
      scrollToMatch: (e) => p.scrollIntoView(e)
    });
  }
});
class Mn {
  /**
  Create a query object.
  */
  constructor(e) {
    this.search = e.search, this.caseSensitive = !!e.caseSensitive, this.literal = !!e.literal, this.regexp = !!e.regexp, this.replace = e.replace || "", this.valid = !!this.search && (!this.regexp || Po(this.search)), this.unquoted = this.unquote(this.search), this.wholeWord = !!e.wholeWord;
  }
  /**
  @internal
  */
  unquote(e) {
    return this.literal ? e : e.replace(/\\([nrt\\])/g, (r, n) => n == "n" ? `
` : n == "r" ? "\r" : n == "t" ? "	" : "\\");
  }
  /**
  Compare this query to another query.
  */
  eq(e) {
    return this.search == e.search && this.replace == e.replace && this.caseSensitive == e.caseSensitive && this.regexp == e.regexp && this.wholeWord == e.wholeWord;
  }
  /**
  @internal
  */
  create() {
    return this.regexp ? new Yo(this) : new jo(this);
  }
  /**
  Get a search cursor for this query, searching through the given
  range in the given state.
  */
  getCursor(e, r = 0, n) {
    let o = e.doc ? e : he.create({ doc: e });
    return n == null && (n = o.doc.length), this.regexp ? Y(this, o, r, n) : Q(this, o, r, n);
  }
}
class Ln {
  constructor(e) {
    this.spec = e;
  }
}
function Q(t, e, r, n) {
  return new te(e.doc, t.unquoted, r, n, t.caseSensitive ? void 0 : (o) => o.toLowerCase(), t.wholeWord ? Jo(e.doc, e.charCategorizer(e.selection.main.head)) : void 0);
}
function Jo(t, e) {
  return (r, n, o, i) => ((i > r || i + o.length < n) && (i = Math.max(0, r - 2), o = t.sliceString(i, Math.min(t.length, n + 2))), (e(Me(o, r - i)) != L.Word || e(Le(o, r - i)) != L.Word) && (e(Le(o, n - i)) != L.Word || e(Me(o, n - i)) != L.Word));
}
class jo extends Ln {
  constructor(e) {
    super(e);
  }
  nextMatch(e, r, n) {
    let o = Q(this.spec, e, n, e.doc.length).nextOverlapping();
    return o.done && (o = Q(this.spec, e, 0, r).nextOverlapping()), o.done ? null : o.value;
  }
  // Searching in reverse is, rather than implementing an inverted search
  // cursor, done by scanning chunk after chunk forward.
  prevMatchInRange(e, r, n) {
    for (let o = n; ; ) {
      let i = Math.max(r, o - 1e4 - this.spec.unquoted.length), s = Q(this.spec, e, i, o), l = null;
      for (; !s.nextOverlapping().done; )
        l = s.value;
      if (l)
        return l;
      if (i == r)
        return null;
      o -= 1e4;
    }
  }
  prevMatch(e, r, n) {
    return this.prevMatchInRange(e, 0, r) || this.prevMatchInRange(e, n, e.doc.length);
  }
  getReplacement(e) {
    return this.spec.unquote(this.spec.replace);
  }
  matchAll(e, r) {
    let n = Q(this.spec, e, 0, e.doc.length), o = [];
    for (; !n.next().done; ) {
      if (o.length >= r)
        return null;
      o.push(n.value);
    }
    return o;
  }
  highlight(e, r, n, o) {
    let i = Q(this.spec, e, Math.max(0, r - this.spec.unquoted.length), Math.min(n + this.spec.unquoted.length, e.doc.length));
    for (; !i.next().done; )
      o(i.value.from, i.value.to);
  }
}
function Y(t, e, r, n) {
  return new Cn(e.doc, t.search, {
    ignoreCase: !t.caseSensitive,
    test: t.wholeWord ? Qo(e.charCategorizer(e.selection.main.head)) : void 0
  }, r, n);
}
function Me(t, e) {
  return t.slice(ee(t, e, !1), e);
}
function Le(t, e) {
  return t.slice(e, ee(t, e));
}
function Qo(t) {
  return (e, r, n) => !n[0].length || (t(Me(n.input, n.index)) != L.Word || t(Le(n.input, n.index)) != L.Word) && (t(Le(n.input, n.index + n[0].length)) != L.Word || t(Me(n.input, n.index + n[0].length)) != L.Word);
}
class Yo extends Ln {
  nextMatch(e, r, n) {
    let o = Y(this.spec, e, n, e.doc.length).next();
    return o.done && (o = Y(this.spec, e, 0, r).next()), o.done ? null : o.value;
  }
  prevMatchInRange(e, r, n) {
    for (let o = 1; ; o++) {
      let i = Math.max(
        r,
        n - o * 1e4
        /* ChunkSize */
      ), s = Y(this.spec, e, i, n), l = null;
      for (; !s.next().done; )
        l = s.value;
      if (l && (i == r || l.from > i + 10))
        return l;
      if (i == r)
        return null;
    }
  }
  prevMatch(e, r, n) {
    return this.prevMatchInRange(e, 0, r) || this.prevMatchInRange(e, n, e.doc.length);
  }
  getReplacement(e) {
    return this.spec.unquote(this.spec.replace.replace(/\$([$&\d+])/g, (r, n) => n == "$" ? "$" : n == "&" ? e.match[0] : n != "0" && +n < e.match.length ? e.match[n] : r));
  }
  matchAll(e, r) {
    let n = Y(this.spec, e, 0, e.doc.length), o = [];
    for (; !n.next().done; ) {
      if (o.length >= r)
        return null;
      o.push(n.value);
    }
    return o;
  }
  highlight(e, r, n, o) {
    let i = Y(this.spec, e, Math.max(
      0,
      r - 250
      /* HighlightMargin */
    ), Math.min(n + 250, e.doc.length));
    for (; !i.next().done; )
      o(i.value.from, i.value.to);
  }
}
const fe = /* @__PURE__ */ w.define(), st = /* @__PURE__ */ w.define(), q = /* @__PURE__ */ Re.define({
  create(t) {
    return new Ve(Ye(t).create(), null);
  },
  update(t, e) {
    for (let r of e.effects)
      r.is(fe) ? t = new Ve(r.value.create(), t.panel) : r.is(st) && (t = new Ve(t.query, r.value ? lt : null));
    return t;
  },
  provide: (t) => tt.from(t, (e) => e.panel)
});
class Ve {
  constructor(e, r) {
    this.query = e, this.panel = r;
  }
}
const Zo = /* @__PURE__ */ x.mark({ class: "cm-searchMatch" }), Xo = /* @__PURE__ */ x.mark({ class: "cm-searchMatch cm-searchMatch-selected" }), ei = /* @__PURE__ */ Ft.fromClass(class {
  constructor(t) {
    this.view = t, this.decorations = this.highlight(t.state.field(q));
  }
  update(t) {
    let e = t.state.field(q);
    (e != t.startState.field(q) || t.docChanged || t.selectionSet || t.viewportChanged) && (this.decorations = this.highlight(e));
  }
  highlight({ query: t, panel: e }) {
    if (!e || !t.spec.valid)
      return x.none;
    let { view: r } = this, n = new tr();
    for (let o = 0, i = r.visibleRanges, s = i.length; o < s; o++) {
      let { from: l, to: a } = i[o];
      for (; o < s - 1 && a > i[o + 1].from - 2 * 250; )
        a = i[++o].to;
      t.highlight(r.state, l, a, (c, u) => {
        let h = r.state.selection.ranges.some((m) => m.from == c && m.to == u);
        n.add(c, u, h ? Xo : Zo);
      });
    }
    return n.finish();
  }
}, {
  decorations: (t) => t.decorations
});
function me(t) {
  return (e) => {
    let r = e.state.field(q, !1);
    return r && r.query.spec.valid ? t(e, r) : En(e);
  };
}
const Be = /* @__PURE__ */ me((t, { query: e }) => {
  let { to: r } = t.state.selection.main, n = e.nextMatch(t.state, r, r);
  if (!n)
    return !1;
  let o = d.single(n.from, n.to), i = t.state.facet(oe);
  return t.dispatch({
    selection: o,
    effects: [at(t, n), i.scrollToMatch(o.main, t)],
    userEvent: "select.search"
  }), Dn(t), !0;
}), De = /* @__PURE__ */ me((t, { query: e }) => {
  let { state: r } = t, { from: n } = r.selection.main, o = e.prevMatch(r, n, n);
  if (!o)
    return !1;
  let i = d.single(o.from, o.to), s = t.state.facet(oe);
  return t.dispatch({
    selection: i,
    effects: [at(t, o), s.scrollToMatch(i.main, t)],
    userEvent: "select.search"
  }), Dn(t), !0;
}), ti = /* @__PURE__ */ me((t, { query: e }) => {
  let r = e.matchAll(t.state, 1e3);
  return !r || !r.length ? !1 : (t.dispatch({
    selection: d.create(r.map((n) => d.range(n.from, n.to))),
    userEvent: "select.search.matches"
  }), !0);
}), ni = ({ state: t, dispatch: e }) => {
  let r = t.selection;
  if (r.ranges.length > 1 || r.main.empty)
    return !1;
  let { from: n, to: o } = r.main, i = [], s = 0;
  for (let l = new te(t.doc, t.sliceDoc(n, o)); !l.next().done; ) {
    if (i.length > 1e3)
      return !1;
    l.value.from == n && (s = i.length), i.push(d.range(l.value.from, l.value.to));
  }
  return e(t.update({
    selection: d.create(i, s),
    userEvent: "select.search.matches"
  })), !0;
}, bt = /* @__PURE__ */ me((t, { query: e }) => {
  let { state: r } = t, { from: n, to: o } = r.selection.main;
  if (r.readOnly)
    return !1;
  let i = e.nextMatch(r, n, n);
  if (!i)
    return !1;
  let s = [], l, a, c = [];
  if (i.from == n && i.to == o && (a = r.toText(e.getReplacement(i)), s.push({ from: i.from, to: i.to, insert: a }), i = e.nextMatch(r, i.from, i.to), c.push(p.announce.of(r.phrase("replaced match on line $", r.doc.lineAt(n).number) + "."))), i) {
    let u = s.length == 0 || s[0].from >= i.to ? 0 : i.to - i.from - a.length;
    l = d.single(i.from - u, i.to - u), c.push(at(t, i)), c.push(r.facet(oe).scrollToMatch(l.main, t));
  }
  return t.dispatch({
    changes: s,
    selection: l,
    effects: c,
    userEvent: "input.replace"
  }), !0;
}), ri = /* @__PURE__ */ me((t, { query: e }) => {
  if (t.state.readOnly)
    return !1;
  let r = e.matchAll(t.state, 1e9).map((o) => {
    let { from: i, to: s } = o;
    return { from: i, to: s, insert: e.getReplacement(o) };
  });
  if (!r.length)
    return !1;
  let n = t.state.phrase("replaced $ matches", r.length) + ".";
  return t.dispatch({
    changes: r,
    effects: p.announce.of(n),
    userEvent: "input.replace.all"
  }), !0;
});
function lt(t) {
  return t.state.facet(oe).createPanel(t);
}
function Ye(t, e) {
  var r, n, o, i, s;
  let l = t.selection.main, a = l.empty || l.to > l.from + 100 ? "" : t.sliceDoc(l.from, l.to);
  if (e && !a)
    return e;
  let c = t.facet(oe);
  return new Mn({
    search: ((r = e == null ? void 0 : e.literal) !== null && r !== void 0 ? r : c.literal) ? a : a.replace(/\n/g, "\\n"),
    caseSensitive: (n = e == null ? void 0 : e.caseSensitive) !== null && n !== void 0 ? n : c.caseSensitive,
    literal: (o = e == null ? void 0 : e.literal) !== null && o !== void 0 ? o : c.literal,
    regexp: (i = e == null ? void 0 : e.regexp) !== null && i !== void 0 ? i : c.regexp,
    wholeWord: (s = e == null ? void 0 : e.wholeWord) !== null && s !== void 0 ? s : c.wholeWord
  });
}
function Bn(t) {
  let e = ue(t, lt);
  return e && e.dom.querySelector("[main-field]");
}
function Dn(t) {
  let e = Bn(t);
  e && e == t.root.activeElement && e.select();
}
const En = (t) => {
  let e = t.state.field(q, !1);
  if (e && e.panel) {
    let r = Bn(t);
    if (r && r != t.root.activeElement) {
      let n = Ye(t.state, e.query.spec);
      n.valid && t.dispatch({ effects: fe.of(n) }), r.focus(), r.select();
    }
  } else
    t.dispatch({ effects: [
      st.of(!0),
      e ? fe.of(Ye(t.state, e.query.spec)) : w.appendConfig.of(li)
    ] });
  return !0;
}, Rn = (t) => {
  let e = t.state.field(q, !1);
  if (!e || !e.panel)
    return !1;
  let r = ue(t, lt);
  return r && r.dom.contains(t.root.activeElement) && t.focus(), t.dispatch({ effects: st.of(!1) }), !0;
}, oi = [
  { key: "Mod-f", run: En, scope: "editor search-panel" },
  { key: "F3", run: Be, shift: De, scope: "editor search-panel", preventDefault: !0 },
  { key: "Mod-g", run: Be, shift: De, scope: "editor search-panel", preventDefault: !0 },
  { key: "Escape", run: Rn, scope: "editor search-panel" },
  { key: "Mod-Shift-l", run: ni },
  { key: "Alt-g", run: Wo },
  { key: "Mod-d", run: Ko, preventDefault: !0 }
];
class ii {
  constructor(e) {
    this.view = e;
    let r = this.query = e.state.field(q).query.spec;
    this.commit = this.commit.bind(this), this.searchField = g("input", {
      value: r.search,
      placeholder: A(e, "Find"),
      "aria-label": A(e, "Find"),
      class: "cm-textfield",
      name: "search",
      form: "",
      "main-field": "true",
      onchange: this.commit,
      onkeyup: this.commit
    }), this.replaceField = g("input", {
      value: r.replace,
      placeholder: A(e, "Replace"),
      "aria-label": A(e, "Replace"),
      class: "cm-textfield",
      name: "replace",
      form: "",
      onchange: this.commit,
      onkeyup: this.commit
    }), this.caseField = g("input", {
      type: "checkbox",
      name: "case",
      form: "",
      checked: r.caseSensitive,
      onchange: this.commit
    }), this.reField = g("input", {
      type: "checkbox",
      name: "re",
      form: "",
      checked: r.regexp,
      onchange: this.commit
    }), this.wordField = g("input", {
      type: "checkbox",
      name: "word",
      form: "",
      checked: r.wholeWord,
      onchange: this.commit
    });
    function n(o, i, s) {
      return g("button", { class: "cm-button", name: o, onclick: i, type: "button" }, s);
    }
    this.dom = g("div", { onkeydown: (o) => this.keydown(o), class: "cm-search" }, [
      this.searchField,
      n("next", () => Be(e), [A(e, "next")]),
      n("prev", () => De(e), [A(e, "previous")]),
      n("select", () => ti(e), [A(e, "all")]),
      g("label", null, [this.caseField, A(e, "match case")]),
      g("label", null, [this.reField, A(e, "regexp")]),
      g("label", null, [this.wordField, A(e, "by word")]),
      ...e.state.readOnly ? [] : [
        g("br"),
        this.replaceField,
        n("replace", () => bt(e), [A(e, "replace")]),
        n("replaceAll", () => ri(e), [A(e, "replace all")])
      ],
      g("button", {
        name: "close",
        onclick: () => Rn(e),
        "aria-label": A(e, "close"),
        type: "button"
      }, ["×"])
    ]);
  }
  commit() {
    let e = new Mn({
      search: this.searchField.value,
      caseSensitive: this.caseField.checked,
      regexp: this.reField.checked,
      wholeWord: this.wordField.checked,
      replace: this.replaceField.value
    });
    e.eq(this.query) || (this.query = e, this.view.dispatch({ effects: fe.of(e) }));
  }
  keydown(e) {
    nr(this.view, e, "search-panel") ? e.preventDefault() : e.keyCode == 13 && e.target == this.searchField ? (e.preventDefault(), (e.shiftKey ? De : Be)(this.view)) : e.keyCode == 13 && e.target == this.replaceField && (e.preventDefault(), bt(this.view));
  }
  update(e) {
    for (let r of e.transactions)
      for (let n of r.effects)
        n.is(fe) && !n.value.eq(this.query) && this.setQuery(n.value);
  }
  setQuery(e) {
    this.query = e, this.searchField.value = e.search, this.replaceField.value = e.replace, this.caseField.checked = e.caseSensitive, this.reField.checked = e.regexp, this.wordField.checked = e.wholeWord;
  }
  mount() {
    this.searchField.select();
  }
  get pos() {
    return 80;
  }
  get top() {
    return this.view.state.facet(oe).top;
  }
}
function A(t, e) {
  return t.state.phrase(e);
}
const ye = 30, xe = /[\s\.,:;?!]/;
function at(t, { from: e, to: r }) {
  let n = t.state.doc.lineAt(e), o = t.state.doc.lineAt(r).to, i = Math.max(n.from, e - ye), s = Math.min(o, r + ye), l = t.state.sliceDoc(i, s);
  if (i != n.from) {
    for (let a = 0; a < ye; a++)
      if (!xe.test(l[a + 1]) && xe.test(l[a])) {
        l = l.slice(a);
        break;
      }
  }
  if (s != o) {
    for (let a = l.length - 1; a > l.length - ye; a--)
      if (!xe.test(l[a - 1]) && xe.test(l[a])) {
        l = l.slice(0, a);
        break;
      }
  }
  return p.announce.of(`${t.state.phrase("current match")}. ${l} ${t.state.phrase("on line")} ${n.number}.`);
}
const si = /* @__PURE__ */ p.baseTheme({
  ".cm-panel.cm-search": {
    padding: "2px 6px 4px",
    position: "relative",
    "& [name=close]": {
      position: "absolute",
      top: "0",
      right: "4px",
      backgroundColor: "inherit",
      border: "none",
      font: "inherit",
      padding: 0,
      margin: 0
    },
    "& input, & button, & label": {
      margin: ".2em .6em .2em 0"
    },
    "& input[type=checkbox]": {
      marginRight: ".2em"
    },
    "& label": {
      fontSize: "80%",
      whiteSpace: "pre"
    }
  },
  "&light .cm-searchMatch": { backgroundColor: "#ffff0054" },
  "&dark .cm-searchMatch": { backgroundColor: "#00ffff8a" },
  "&light .cm-searchMatch-selected": { backgroundColor: "#ff6a0054" },
  "&dark .cm-searchMatch-selected": { backgroundColor: "#ff00ff8a" }
}), li = [
  q,
  /* @__PURE__ */ Xn.lowest(ei),
  si
];
class ai {
  constructor(e, r, n) {
    this.from = e, this.to = r, this.diagnostic = n;
  }
}
class z {
  constructor(e, r, n) {
    this.diagnostics = e, this.panel = r, this.selected = n;
  }
  static init(e, r, n) {
    let o = e, i = n.facet(On).markerFilter;
    i && (o = i(o));
    let s = x.set(o.map((l) => l.from == l.to || l.from == l.to - 1 && n.doc.lineAt(l.from).to == l.from ? x.widget({
      widget: new yi(l),
      diagnostic: l
    }).range(l.from) : x.mark({
      attributes: { class: "cm-lintRange cm-lintRange-" + l.severity + (l.markClass ? " " + l.markClass : "") },
      diagnostic: l
    }).range(l.from, l.to)), !0);
    return new z(s, r, ne(s));
  }
}
function ne(t, e = null, r = 0) {
  let n = null;
  return t.between(r, 1e9, (o, i, { spec: s }) => {
    if (!(e && s.diagnostic != e))
      return n = new ai(o, i, s.diagnostic), !1;
  }), n;
}
function ci(t, e) {
  let r = t.startState.doc.lineAt(e.pos);
  return !!(t.effects.some((n) => n.is(wn)) || t.changes.touchesRange(r.from, r.to));
}
function ui(t, e) {
  return t.field(M, !1) ? e : e.concat(w.appendConfig.of(bi));
}
const wn = /* @__PURE__ */ w.define(), ct = /* @__PURE__ */ w.define(), Tn = /* @__PURE__ */ w.define(), M = /* @__PURE__ */ Re.define({
  create() {
    return new z(x.none, null, null);
  },
  update(t, e) {
    if (e.docChanged) {
      let r = t.diagnostics.map(e.changes), n = null;
      if (t.selected) {
        let o = e.changes.mapPos(t.selected.from, 1);
        n = ne(r, t.selected.diagnostic, o) || ne(r, null, o);
      }
      t = new z(r, t.panel, n);
    }
    for (let r of e.effects)
      r.is(wn) ? t = z.init(r.value, t.panel, e.state) : r.is(ct) ? t = new z(t.diagnostics, r.value ? We.open : null, t.selected) : r.is(Tn) && (t = new z(t.diagnostics, t.panel, r.value));
    return t;
  },
  provide: (t) => [
    tt.from(t, (e) => e.panel),
    p.decorations.from(t, (e) => e.diagnostics)
  ]
}), hi = /* @__PURE__ */ x.mark({ class: "cm-lintRange cm-lintRange-active" });
function fi(t, e, r) {
  let { diagnostics: n } = t.state.field(M), o = [], i = 2e8, s = 0;
  n.between(e - (r < 0 ? 1 : 0), e + (r > 0 ? 1 : 0), (a, c, { spec: u }) => {
    e >= a && e <= c && (a == c || (e > a || r > 0) && (e < c || r < 0)) && (o.push(u.diagnostic), i = Math.min(a, i), s = Math.max(c, s));
  });
  let l = t.state.facet(On).tooltipFilter;
  return l && (o = l(o)), o.length ? {
    pos: i,
    end: s,
    above: t.state.doc.lineAt(i).to < s,
    create() {
      return { dom: di(t, o) };
    }
  } : null;
}
function di(t, e) {
  return g("ul", { class: "cm-tooltip-lint" }, e.map((r) => Pn(t, r, !1)));
}
const mi = (t) => {
  let e = t.state.field(M, !1);
  (!e || !e.panel) && t.dispatch({ effects: ui(t.state, [ct.of(!0)]) });
  let r = ue(t, We.open);
  return r && r.dom.querySelector(".cm-panel-lint ul").focus(), !0;
}, St = (t) => {
  let e = t.state.field(M, !1);
  return !e || !e.panel ? !1 : (t.dispatch({ effects: ct.of(!1) }), !0);
}, gi = (t) => {
  let e = t.state.field(M, !1);
  if (!e)
    return !1;
  let r = t.state.selection.main, n = e.diagnostics.iter(r.to + 1);
  return !n.value && (n = e.diagnostics.iter(0), !n.value || n.from == r.from && n.to == r.to) ? !1 : (t.dispatch({ selection: { anchor: n.from, head: n.to }, scrollIntoView: !0 }), !0);
}, pi = [
  { key: "Mod-Shift-m", run: mi, preventDefault: !0 },
  { key: "F8", run: gi }
], On = /* @__PURE__ */ de.define({
  combine(t) {
    return Object.assign({ sources: t.map((e) => e.source) }, Ee(t.map((e) => e.config), {
      delay: 750,
      markerFilter: null,
      tooltipFilter: null,
      needsRefresh: null
    }, {
      needsRefresh: (e, r) => e ? r ? (n) => e(n) || r(n) : e : r
    }));
  }
});
function In(t) {
  let e = [];
  if (t)
    e:
      for (let { name: r } of t) {
        for (let n = 0; n < r.length; n++) {
          let o = r[n];
          if (/[a-zA-Z]/.test(o) && !e.some((i) => i.toLowerCase() == o.toLowerCase())) {
            e.push(o);
            continue e;
          }
        }
        e.push("");
      }
  return e;
}
function Pn(t, e, r) {
  var n;
  let o = r ? In(e.actions) : [];
  return g("li", { class: "cm-diagnostic cm-diagnostic-" + e.severity }, g("span", { class: "cm-diagnosticText" }, e.renderMessage ? e.renderMessage() : e.message), (n = e.actions) === null || n === void 0 ? void 0 : n.map((i, s) => {
    let l = !1, a = (m) => {
      if (m.preventDefault(), l)
        return;
      l = !0;
      let k = ne(t.state.field(M).diagnostics, e);
      k && i.apply(t, k.from, k.to);
    }, { name: c } = i, u = o[s] ? c.indexOf(o[s]) : -1, h = u < 0 ? c : [
      c.slice(0, u),
      g("u", c.slice(u, u + 1)),
      c.slice(u + 1)
    ];
    return g("button", {
      type: "button",
      class: "cm-diagnosticAction",
      onclick: a,
      onmousedown: a,
      "aria-label": ` Action: ${c}${u < 0 ? "" : ` (access key "${o[s]})"`}.`
    }, h);
  }), e.source && g("div", { class: "cm-diagnosticSource" }, e.source));
}
class yi extends or {
  constructor(e) {
    super(), this.diagnostic = e;
  }
  eq(e) {
    return e.diagnostic == this.diagnostic;
  }
  toDOM() {
    return g("span", { class: "cm-lintPoint cm-lintPoint-" + this.diagnostic.severity });
  }
}
class Ct {
  constructor(e, r) {
    this.diagnostic = r, this.id = "item_" + Math.floor(Math.random() * 4294967295).toString(16), this.dom = Pn(e, r, !0), this.dom.id = this.id, this.dom.setAttribute("role", "option");
  }
}
class We {
  constructor(e) {
    this.view = e, this.items = [];
    let r = (o) => {
      if (o.keyCode == 27)
        St(this.view), this.view.focus();
      else if (o.keyCode == 38 || o.keyCode == 33)
        this.moveSelection((this.selectedIndex - 1 + this.items.length) % this.items.length);
      else if (o.keyCode == 40 || o.keyCode == 34)
        this.moveSelection((this.selectedIndex + 1) % this.items.length);
      else if (o.keyCode == 36)
        this.moveSelection(0);
      else if (o.keyCode == 35)
        this.moveSelection(this.items.length - 1);
      else if (o.keyCode == 13)
        this.view.focus();
      else if (o.keyCode >= 65 && o.keyCode <= 90 && this.selectedIndex >= 0) {
        let { diagnostic: i } = this.items[this.selectedIndex], s = In(i.actions);
        for (let l = 0; l < s.length; l++)
          if (s[l].toUpperCase().charCodeAt(0) == o.keyCode) {
            let a = ne(this.view.state.field(M).diagnostics, i);
            a && i.actions[l].apply(e, a.from, a.to);
          }
      } else
        return;
      o.preventDefault();
    }, n = (o) => {
      for (let i = 0; i < this.items.length; i++)
        this.items[i].dom.contains(o.target) && this.moveSelection(i);
    };
    this.list = g("ul", {
      tabIndex: 0,
      role: "listbox",
      "aria-label": this.view.state.phrase("Diagnostics"),
      onkeydown: r,
      onclick: n
    }), this.dom = g("div", { class: "cm-panel-lint" }, this.list, g("button", {
      type: "button",
      name: "close",
      "aria-label": this.view.state.phrase("close"),
      onclick: () => St(this.view)
    }, "×")), this.update();
  }
  get selectedIndex() {
    let e = this.view.state.field(M).selected;
    if (!e)
      return -1;
    for (let r = 0; r < this.items.length; r++)
      if (this.items[r].diagnostic == e.diagnostic)
        return r;
    return -1;
  }
  update() {
    let { diagnostics: e, selected: r } = this.view.state.field(M), n = 0, o = !1, i = null;
    for (e.between(0, this.view.state.doc.length, (s, l, { spec: a }) => {
      let c = -1, u;
      for (let h = n; h < this.items.length; h++)
        if (this.items[h].diagnostic == a.diagnostic) {
          c = h;
          break;
        }
      c < 0 ? (u = new Ct(this.view, a.diagnostic), this.items.splice(n, 0, u), o = !0) : (u = this.items[c], c > n && (this.items.splice(n, c - n), o = !0)), r && u.diagnostic == r.diagnostic ? u.dom.hasAttribute("aria-selected") || (u.dom.setAttribute("aria-selected", "true"), i = u) : u.dom.hasAttribute("aria-selected") && u.dom.removeAttribute("aria-selected"), n++;
    }); n < this.items.length && !(this.items.length == 1 && this.items[0].diagnostic.from < 0); )
      o = !0, this.items.pop();
    this.items.length == 0 && (this.items.push(new Ct(this.view, {
      from: -1,
      to: -1,
      severity: "info",
      message: this.view.state.phrase("No diagnostics")
    })), o = !0), i ? (this.list.setAttribute("aria-activedescendant", i.id), this.view.requestMeasure({
      key: this,
      read: () => ({ sel: i.dom.getBoundingClientRect(), panel: this.list.getBoundingClientRect() }),
      write: ({ sel: s, panel: l }) => {
        s.top < l.top ? this.list.scrollTop -= l.top - s.top : s.bottom > l.bottom && (this.list.scrollTop += s.bottom - l.bottom);
      }
    })) : this.selectedIndex < 0 && this.list.removeAttribute("aria-activedescendant"), o && this.sync();
  }
  sync() {
    let e = this.list.firstChild;
    function r() {
      let n = e;
      e = n.nextSibling, n.remove();
    }
    for (let n of this.items)
      if (n.dom.parentNode == this.list) {
        for (; e != n.dom; )
          r();
        e = n.dom.nextSibling;
      } else
        this.list.insertBefore(n.dom, e);
    for (; e; )
      r();
  }
  moveSelection(e) {
    if (this.selectedIndex < 0)
      return;
    let r = this.view.state.field(M), n = ne(r.diagnostics, this.items[e].diagnostic);
    n && this.view.dispatch({
      selection: { anchor: n.from, head: n.to },
      scrollIntoView: !0,
      effects: Tn.of(n)
    });
  }
  static open(e) {
    return new We(e);
  }
}
function xi(t, e = 'viewBox="0 0 40 40"') {
  return `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" ${e}>${encodeURIComponent(t)}</svg>')`;
}
function ke(t) {
  return xi(`<path d="m0 2.5 l2 -1.5 l1 0 l2 1.5 l1 0" stroke="${t}" fill="none" stroke-width=".7"/>`, 'width="6" height="3"');
}
const ki = /* @__PURE__ */ p.baseTheme({
  ".cm-diagnostic": {
    padding: "3px 6px 3px 8px",
    marginLeft: "-1px",
    display: "block",
    whiteSpace: "pre-wrap"
  },
  ".cm-diagnostic-error": { borderLeft: "5px solid #d11" },
  ".cm-diagnostic-warning": { borderLeft: "5px solid orange" },
  ".cm-diagnostic-info": { borderLeft: "5px solid #999" },
  ".cm-diagnostic-hint": { borderLeft: "5px solid #66d" },
  ".cm-diagnosticAction": {
    font: "inherit",
    border: "none",
    padding: "2px 4px",
    backgroundColor: "#444",
    color: "white",
    borderRadius: "3px",
    marginLeft: "8px",
    cursor: "pointer"
  },
  ".cm-diagnosticSource": {
    fontSize: "70%",
    opacity: 0.7
  },
  ".cm-lintRange": {
    backgroundPosition: "left bottom",
    backgroundRepeat: "repeat-x",
    paddingBottom: "0.7px"
  },
  ".cm-lintRange-error": { backgroundImage: /* @__PURE__ */ ke("#d11") },
  ".cm-lintRange-warning": { backgroundImage: /* @__PURE__ */ ke("orange") },
  ".cm-lintRange-info": { backgroundImage: /* @__PURE__ */ ke("#999") },
  ".cm-lintRange-hint": { backgroundImage: /* @__PURE__ */ ke("#66d") },
  ".cm-lintRange-active": { backgroundColor: "#ffdd9980" },
  ".cm-tooltip-lint": {
    padding: 0,
    margin: 0
  },
  ".cm-lintPoint": {
    position: "relative",
    "&:after": {
      content: '""',
      position: "absolute",
      bottom: 0,
      left: "-2px",
      borderLeft: "3px solid transparent",
      borderRight: "3px solid transparent",
      borderBottom: "4px solid #d11"
    }
  },
  ".cm-lintPoint-warning": {
    "&:after": { borderBottomColor: "orange" }
  },
  ".cm-lintPoint-info": {
    "&:after": { borderBottomColor: "#999" }
  },
  ".cm-lintPoint-hint": {
    "&:after": { borderBottomColor: "#66d" }
  },
  ".cm-panel.cm-panel-lint": {
    position: "relative",
    "& ul": {
      maxHeight: "100px",
      overflowY: "auto",
      "& [aria-selected]": {
        backgroundColor: "#ddd",
        "& u": { textDecoration: "underline" }
      },
      "&:focus [aria-selected]": {
        background_fallback: "#bdf",
        backgroundColor: "Highlight",
        color_fallback: "white",
        color: "HighlightText"
      },
      "& u": { textDecoration: "none" },
      padding: 0,
      margin: 0
    },
    "& [name=close]": {
      position: "absolute",
      top: "0",
      right: "2px",
      background: "inherit",
      border: "none",
      font: "inherit",
      padding: 0,
      margin: 0
    }
  }
}), bi = [
  M,
  /* @__PURE__ */ p.decorations.compute([M], (t) => {
    let { selected: e, panel: r } = t.field(M);
    return !e || !r || e.from == e.to ? x.none : x.set([
      hi.range(e.from, e.to)
    ]);
  }),
  /* @__PURE__ */ rr(fi, { hideOn: ci }),
  ki
];
var vt = function(e) {
  e === void 0 && (e = {});
  var {
    crosshairCursor: r = !1
  } = e, n = [];
  e.closeBracketsKeymap !== !1 && (n = n.concat(ir)), e.defaultKeymap !== !1 && (n = n.concat(Oo)), e.searchKeymap !== !1 && (n = n.concat(oi)), e.historyKeymap !== !1 && (n = n.concat(zr)), e.foldKeymap !== !1 && (n = n.concat(sr)), e.completionKeymap !== !1 && (n = n.concat(lr)), e.lintKeymap !== !1 && (n = n.concat(pi));
  var o = [];
  return e.lineNumbers !== !1 && o.push(ar()), e.highlightActiveLineGutter !== !1 && o.push(cr()), e.highlightSpecialChars !== !1 && o.push(ur()), e.history !== !1 && o.push(Ir()), e.foldGutter !== !1 && o.push(hr()), e.drawSelection !== !1 && o.push(fr()), e.dropCursor !== !1 && o.push(dr()), e.allowMultipleSelections !== !1 && o.push(he.allowMultipleSelections.of(!0)), e.indentOnInput !== !1 && o.push(mr()), e.syntaxHighlighting !== !1 && o.push(Nt(Sr, {
    fallback: !0
  })), e.bracketMatching !== !1 && o.push(gr()), e.closeBrackets !== !1 && o.push(pr()), e.autocompletion !== !1 && o.push(yr()), e.rectangularSelection !== !1 && o.push(xr()), r !== !1 && o.push(kr()), e.highlightActiveLine !== !1 && o.push(br()), e.highlightSelectionMatches !== !1 && o.push(_o()), e.tabSize && typeof e.tabSize == "number" && o.push(Pt.of(" ".repeat(e.tabSize))), o.concat([_t.of(n.flat())]).filter(Boolean);
};
const Si = "#e5c07b", At = "#e06c75", Ci = "#56b6c2", vi = "#ffffff", be = "#abb2bf", Ze = "#7d8799", Ai = "#61afef", Mi = "#98c379", Mt = "#d19a66", Li = "#c678dd", Bi = "#21252b", Lt = "#2c313a", Bt = "#282c34", ze = "#353a42", Di = "#3E4451", Dt = "#528bff", Ei = /* @__PURE__ */ p.theme({
  "&": {
    color: be,
    backgroundColor: Bt
  },
  ".cm-content": {
    caretColor: Dt
  },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: Dt },
  "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": { backgroundColor: Di },
  ".cm-panels": { backgroundColor: Bi, color: be },
  ".cm-panels.cm-panels-top": { borderBottom: "2px solid black" },
  ".cm-panels.cm-panels-bottom": { borderTop: "2px solid black" },
  ".cm-searchMatch": {
    backgroundColor: "#72a1ff59",
    outline: "1px solid #457dff"
  },
  ".cm-searchMatch.cm-searchMatch-selected": {
    backgroundColor: "#6199ff2f"
  },
  ".cm-activeLine": { backgroundColor: "#6699ff0b" },
  ".cm-selectionMatch": { backgroundColor: "#aafe661a" },
  "&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket": {
    backgroundColor: "#bad0f847"
  },
  ".cm-gutters": {
    backgroundColor: Bt,
    color: Ze,
    border: "none"
  },
  ".cm-activeLineGutter": {
    backgroundColor: Lt
  },
  ".cm-foldPlaceholder": {
    backgroundColor: "transparent",
    border: "none",
    color: "#ddd"
  },
  ".cm-tooltip": {
    border: "none",
    backgroundColor: ze
  },
  ".cm-tooltip .cm-tooltip-arrow:before": {
    borderTopColor: "transparent",
    borderBottomColor: "transparent"
  },
  ".cm-tooltip .cm-tooltip-arrow:after": {
    borderTopColor: ze,
    borderBottomColor: ze
  },
  ".cm-tooltip-autocomplete": {
    "& > ul > li[aria-selected]": {
      backgroundColor: Lt,
      color: be
    }
  }
}, { dark: !0 }), Ri = /* @__PURE__ */ Cr.define([
  {
    tag: f.keyword,
    color: Li
  },
  {
    tag: [f.name, f.deleted, f.character, f.propertyName, f.macroName],
    color: At
  },
  {
    tag: [/* @__PURE__ */ f.function(f.variableName), f.labelName],
    color: Ai
  },
  {
    tag: [f.color, /* @__PURE__ */ f.constant(f.name), /* @__PURE__ */ f.standard(f.name)],
    color: Mt
  },
  {
    tag: [/* @__PURE__ */ f.definition(f.name), f.separator],
    color: be
  },
  {
    tag: [f.typeName, f.className, f.number, f.changed, f.annotation, f.modifier, f.self, f.namespace],
    color: Si
  },
  {
    tag: [f.operator, f.operatorKeyword, f.url, f.escape, f.regexp, f.link, /* @__PURE__ */ f.special(f.string)],
    color: Ci
  },
  {
    tag: [f.meta, f.comment],
    color: Ze
  },
  {
    tag: f.strong,
    fontWeight: "bold"
  },
  {
    tag: f.emphasis,
    fontStyle: "italic"
  },
  {
    tag: f.strikethrough,
    textDecoration: "line-through"
  },
  {
    tag: f.link,
    color: Ze,
    textDecoration: "underline"
  },
  {
    tag: f.heading,
    fontWeight: "bold",
    color: At
  },
  {
    tag: [f.atom, f.bool, /* @__PURE__ */ f.special(f.variableName)],
    color: Mt
  },
  {
    tag: [f.processingInstruction, f.string, f.inserted],
    color: Mi
  },
  {
    tag: f.invalid,
    color: vi
  }
]), wi = [Ei, /* @__PURE__ */ Nt(Ri)];
var Ti = p.theme({
  "&": {
    backgroundColor: "#fff"
  }
}, {
  dark: !1
}), Oi = function(e) {
  e === void 0 && (e = {});
  var {
    indentWithTab: r = !0,
    editable: n = !0,
    readOnly: o = !1,
    theme: i = "light",
    placeholder: s = "",
    basicSetup: l = !0
  } = e, a = [];
  switch (r && a.unshift(_t.of([Io])), l && (typeof l == "boolean" ? a.unshift(vt()) : a.unshift(vt(l))), s && a.unshift(vr(s)), i) {
    case "light":
      a.push(Ti);
      break;
    case "dark":
      a.push(wi);
      break;
    case "none":
      break;
    default:
      a.push(i);
      break;
  }
  return n === !1 && a.push(p.editable.of(!1)), o && a.push(he.readOnly.of(!0)), [...a];
}, Ii = (t) => ({
  line: t.state.doc.lineAt(t.state.selection.main.from),
  lineCount: t.state.doc.lines,
  lineBreak: t.state.lineBreak,
  length: t.state.doc.length,
  readOnly: t.state.readOnly,
  tabSize: t.state.tabSize,
  selection: t.state.selection,
  selectionAsSingle: t.state.selection.asSingle().main,
  ranges: t.state.selection.ranges,
  selectionCode: t.state.sliceDoc(t.state.selection.main.from, t.state.selection.main.to),
  selections: t.state.selection.ranges.map((e) => t.state.sliceDoc(e.from, e.to)),
  selectedText: t.state.selection.ranges.some((e) => !e.empty)
}), Et = Xe.define(), Pi = [];
function Wi(t) {
  var {
    value: e,
    selection: r,
    onChange: n,
    onStatistics: o,
    onCreateEditor: i,
    onUpdate: s,
    extensions: l = Pi,
    autoFocus: a,
    theme: c = "light",
    height: u = null,
    minHeight: h = null,
    maxHeight: m = null,
    width: k = null,
    minWidth: C = null,
    maxWidth: E = null,
    placeholder: U = "",
    editable: $ = !0,
    readOnly: V = !1,
    indentWithTab: G = !0,
    basicSetup: K = !0,
    root: ie,
    initialState: P
  } = t, [W, J] = ce(), [y, b] = ce(), [F, j] = ce(), Fe = p.theme({
    "&": {
      height: u,
      minHeight: h,
      maxHeight: m,
      width: k,
      minWidth: C,
      maxWidth: E
    },
    "& .cm-scroller": {
      height: "100% !important"
    }
  }), Ne = p.updateListener.of((R) => {
    if (R.docChanged && typeof n == "function" && // Fix echoing of the remote changes:
    // If transaction is market as remote we don't have to call `onChange` handler again
    !R.transactions.some((Nn) => Nn.annotation(Et))) {
      var le = R.state.doc, ge = le.toString();
      n(ge, R);
    }
    o && o(Ii(R));
  }), Fn = Oi({
    theme: c,
    editable: $,
    readOnly: V,
    placeholder: U,
    indentWithTab: G,
    basicSetup: K
  }), se = [Ne, Fe, ...Fn];
  return s && typeof s == "function" && se.push(p.updateListener.of(s)), se = se.concat(l), _(() => {
    if (W && !F) {
      var R = {
        doc: e,
        selection: r,
        extensions: se
      }, le = P ? he.fromJSON(P.json, R, P.fields) : he.create(R);
      if (j(le), !y) {
        var ge = new p({
          state: le,
          parent: W,
          root: ie
        });
        b(ge), i && i(ge, le);
      }
    }
    return () => {
      y && (j(void 0), b(void 0));
    };
  }, [W, F]), _(() => J(t.container), [t.container]), _(() => () => {
    y && (y.destroy(), b(void 0));
  }, [y]), _(() => {
    a && y && y.focus();
  }, [a, y]), _(() => {
    y && y.dispatch({
      effects: w.reconfigure.of(se)
    });
  }, [c, l, u, h, m, k, C, E, U, $, V, G, K, n, s]), _(() => {
    if (e !== void 0) {
      var R = y ? y.state.doc.toString() : "";
      y && e !== R && y.dispatch({
        changes: {
          from: 0,
          to: R.length,
          insert: e || ""
        },
        annotations: [Et.of(!0)]
      });
    }
  }, [e, y]), {
    state: F,
    setState: j,
    view: y,
    setView: b,
    container: W,
    setContainer: J
  };
}
var Fi = ["className", "value", "selection", "extensions", "onChange", "onStatistics", "onCreateEditor", "onUpdate", "autoFocus", "theme", "height", "minHeight", "maxHeight", "width", "minWidth", "maxWidth", "basicSetup", "placeholder", "indentWithTab", "editable", "readOnly", "root", "initialState"], Wn = /* @__PURE__ */ Rt((t, e) => {
  var {
    className: r,
    value: n = "",
    selection: o,
    extensions: i = [],
    onChange: s,
    onStatistics: l,
    onCreateEditor: a,
    onUpdate: c,
    autoFocus: u,
    theme: h = "light",
    height: m,
    minHeight: k,
    maxHeight: C,
    width: E,
    minWidth: U,
    maxWidth: $,
    basicSetup: V,
    placeholder: G,
    indentWithTab: K,
    editable: ie,
    readOnly: P,
    root: W,
    initialState: J
  } = t, y = _n(t, Fi), b = wt(null), {
    state: F,
    view: j,
    container: Fe
  } = Wi({
    container: b.current,
    root: W,
    value: n,
    autoFocus: u,
    theme: h,
    height: m,
    minHeight: k,
    maxHeight: C,
    width: E,
    minWidth: U,
    maxWidth: $,
    basicSetup: V,
    placeholder: G,
    indentWithTab: K,
    editable: ie,
    readOnly: P,
    selection: o,
    onChange: s,
    onStatistics: l,
    onCreateEditor: a,
    onUpdate: c,
    extensions: i,
    initialState: J
  });
  if (qn(e, () => ({
    editor: b.current,
    state: F,
    view: j
  }), [b, Fe, F, j]), typeof n != "string")
    throw new Error("value must be typeof string but got " + typeof n);
  var Ne = typeof h == "string" ? "cm-theme-" + h : "cm-theme";
  return /* @__PURE__ */ N.jsx("div", Hn({
    ref: b,
    className: "" + Ne + (r ? " " + r : "")
  }, y));
});
Wn.displayName = "CodeMirror";
const Ni = [
  "[&_.cm-editor]:bg-transparent",
  "[&_.cm-editor]:border-transparent",
  "[&_.cm-scroller]:font-mono",
  "[&_.cm-scroller]:border-transparent",
  "[&_.cm-activeLine]:bg-transparent",
  "[&_.cm-activeLineGutter]:bg-transparent",
  "[&_.cm-gutters]:bg-grey-75 dark:[&_.cm-gutters]:bg-grey-950",
  "[&_.cm-gutters]:text-grey-600 dark:[&_.cm-gutters]:text-grey-500",
  "[&_.cm-gutters]:border-grey-500 dark:[&_.cm-gutters]:border-grey-800",
  "[&_.cm-cursor]:border-grey-900 dark:[&_.cm-cursor]:border-grey-75",
  "dark:[&_.cm-tooltip-autocomplete.cm-tooltip_ul_li:not([aria-selected])]:bg-grey-975"
].join(" "), Hi = Rt(function({
  title: e,
  value: r,
  height: n = "200px",
  error: o,
  hint: i,
  clearBg: s = !0,
  extensions: l,
  onChange: a,
  onFocus: c,
  onBlur: u,
  className: h,
  ...m
}, k) {
  const C = Vn(), E = wt(null), [U, $] = ce(100), [V, G] = zn.useState(null), [K, ie] = ce({
    crosshairCursor: !1
  }), { setFocusState: P } = Un(), W = (b) => {
    c == null || c(b), P(!0);
  }, J = (b) => {
    u == null || u(b), P(!1);
  };
  _(() => {
    Promise.all(l).then(G), ie((b) => ({ setup: b, searchKeymap: !1 }));
  }, [l]), _(() => {
    const b = new ResizeObserver(([F]) => {
      $(F.contentRect.width);
    });
    return b.observe(E.current), () => b.disconnect();
  }, []);
  const y = $n(
    "peer order-2 w-full max-w-full overflow-hidden rounded-sm border",
    s ? "bg-transparent" : "bg-grey-75",
    o ? "border-red" : "border-grey-500 dark:border-grey-800",
    e && "mt-2",
    n === "full" && "h-full",
    Ni,
    h
  );
  return /* @__PURE__ */ N.jsxs(N.Fragment, { children: [
    /* @__PURE__ */ N.jsx("div", { ref: E }),
    V && /* @__PURE__ */ N.jsxs("div", { className: n === "full" ? "h-full" : "", style: { width: U }, children: [
      /* @__PURE__ */ N.jsx(
        Wn,
        {
          ref: k,
          basicSetup: K,
          className: y,
          extensions: V,
          height: n === "full" ? "100%" : n,
          value: r,
          onBlur: J,
          onChange: a,
          onFocus: W,
          ...m
        }
      ),
      e && /* @__PURE__ */ N.jsx(Gn, { className: "order-1 !text-grey-700 peer-focus:!text-black", htmlFor: C, useLabelTag: !0, children: e }),
      i && /* @__PURE__ */ N.jsx(Kn, { className: "order-3", color: o ? "red" : "", children: i })
    ] })
  ] });
});
export {
  Hi as default
};
//# sourceMappingURL=CodeEditorView-3601b44e.mjs.map
