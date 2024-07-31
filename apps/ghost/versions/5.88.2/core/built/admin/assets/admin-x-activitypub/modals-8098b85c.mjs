import { u as he, a as xe, c as n, j as s, H as X, b as fe, d as oe, e as be, f as B, g as z, B as K, h as we, N as E, S as ge, s as ye, i as ve, n as re, p as ke, k as je, l as Fe, m as se, o as Me, q as Y, r as D, A as G, t as Re, L as ie, v as ae, w as le, x as ce } from "./index-d7494526.mjs";
const Ce = ({
  type: o = "text",
  inputRef: t,
  title: e,
  hideTitle: r,
  value: a,
  error: i,
  placeholder: u,
  rightPlaceholder: c,
  hint: l,
  onChange: h,
  onFocus: x,
  onBlur: w,
  clearBg: k = !1,
  className: j = "",
  maxLength: F,
  containerClassName: U = "",
  hintClassName: y = "",
  unstyled: f = !1,
  disabled: S,
  ...M
}) => {
  const T = he(), { setFocusState: H } = xe(), _ = (C) => {
    x == null || x(C), H(!0);
  }, I = (C) => {
    w == null || w(C), H(!1);
  }, $ = n(
    "relative order-2 flex w-full items-center",
    e && !r && "mt-1.5"
  ), q = !f && n(
    "absolute inset-0 rounded-lg border text-grey-300 transition-colors peer-hover:bg-grey-100 peer-focus:border-green peer-focus:bg-white peer-focus:shadow-[0_0_0_2px_rgba(48,207,67,.25)] dark:peer-hover:bg-grey-925 dark:peer-focus:bg-grey-950",
    i ? "border-red bg-white dark:bg-grey-925" : "border-transparent bg-grey-150 dark:bg-grey-900",
    S && "bg-grey-50 peer-hover:bg-grey-50 dark:bg-grey-950 dark:peer-hover:bg-grey-950"
  ), R = !f && n(
    "peer z-[1] order-2 h-9 w-full bg-transparent px-3 py-1.5 text-sm placeholder:text-grey-500 dark:placeholder:text-grey-700 md:h-[38px] md:py-2 md:text-md",
    S ? "cursor-not-allowed text-grey-600 opacity-60 dark:text-grey-800" : "dark:text-white",
    c ? "w-0 grow rounded-l-lg" : "rounded-lg",
    j
  ), P = !f && n(
    "z-[1] order-3 rounded-r-lg",
    c ? typeof c == "string" ? "flex h-8 items-center py-1 pr-3 text-right text-sm text-grey-500 md:h-9 md:text-base" : "h-9 pr-1" : "pr-2"
  );
  let v = /* @__PURE__ */ s.jsx(s.Fragment, {});
  const Q = /* @__PURE__ */ s.jsx(
    "input",
    {
      ref: t,
      className: R || j,
      disabled: S,
      id: T,
      maxLength: F,
      placeholder: u,
      type: o,
      value: a,
      onBlur: I,
      onChange: h,
      onFocus: _,
      ...M
    }
  );
  return v = /* @__PURE__ */ s.jsxs("div", { className: $, children: [
    Q,
    !f && !k && /* @__PURE__ */ s.jsx("div", { className: q || "" }),
    c && /* @__PURE__ */ s.jsx("span", { className: P || "", children: c })
  ] }), y = n(
    "order-3",
    y
  ), U = n(
    "flex flex-col",
    U
  ), e || l ? /* @__PURE__ */ s.jsxs("div", { className: U, children: [
    v,
    e && /* @__PURE__ */ s.jsx(X, { className: r ? "sr-only" : "order-1", htmlFor: T, useLabelTag: !0, children: e }),
    l && /* @__PURE__ */ s.jsx(fe, { className: y, color: i ? "red" : "default", children: l })
  ] }) : v;
}, Le = ({
  shiftY: o,
  footerBgColorClass: t = "bg-white dark:bg-black",
  contentBgColorClass: e = "bg-white dark:bg-black",
  height: r = 96,
  children: a
}) => {
  const i = n(
    "w-100 sticky bottom-[-24px] z-[297] m-0 box-border p-0"
  ), u = o ? `calc(${o} - 24px)` : "-24px", c = `${r + 24}px`, l = n(
    "sticky z-[298] block h-[24px]",
    e
  ), h = "0", x = n(
    "sticky z-[299] mb-[-24px] flex items-center justify-between",
    "h-[96px]",
    t
  ), w = "0", k = `${r}px`, j = "sticky mx-2 block h-[24px] rounded-full shadow-[0_0_0_1px_rgba(0,0,0,.025),0_-8px_16px_-3px_rgba(0,0,0,.08)]", F = o ? `calc(${o} + ${r - 24}px)` : `${r - 24}px`;
  return /* @__PURE__ */ s.jsxs(
    "div",
    {
      className: i,
      style: {
        bottom: u,
        height: c
      },
      children: [
        /* @__PURE__ */ s.jsx(
          "div",
          {
            className: l,
            style: {
              bottom: h
            }
          }
        ),
        /* @__PURE__ */ s.jsx(
          "div",
          {
            className: x,
            style: {
              bottom: w,
              height: k
            },
            children: a
          }
        ),
        /* @__PURE__ */ s.jsx(
          "div",
          {
            className: j,
            style: {
              bottom: F
            }
          }
        )
      ]
    }
  );
};
function ne(o, t, e = {}) {
  o ? E.show(Ue, {
    title: "Are you sure you want to leave this page?",
    prompt: /* @__PURE__ */ s.jsxs(s.Fragment, { children: [
      /* @__PURE__ */ s.jsx("p", { children: "Hey there! It looks like you didn't save the changes you made." }),
      /* @__PURE__ */ s.jsx("p", { children: "Save before you go!" })
    ] }),
    okLabel: "Leave",
    cancelLabel: "Stay",
    okColor: "red",
    onOk: (r) => {
      t(), r == null || r.remove();
    },
    ...e
  }) : t();
}
const Ne = "bg-[rgba(98,109,121,0.2)] backdrop-blur-[3px]", V = ({
  size: o = "md",
  width: t,
  height: e,
  testId: r,
  title: a,
  okLabel: i = "OK",
  okLoading: u = !1,
  cancelLabel: c = "Cancel",
  footer: l,
  header: h,
  leftButtonProps: x,
  buttonsDisabled: w,
  okDisabled: k,
  padding: j = !0,
  onOk: F,
  okColor: U = "black",
  onCancel: y,
  topRightContent: f,
  hideXOnMobile: S = !1,
  afterClose: M,
  children: T,
  backDrop: H = !0,
  backDropClick: _ = !0,
  stickyFooter: I = !1,
  stickyHeader: $ = !1,
  scrolling: q = !0,
  dirty: R = !1,
  animate: P = !0,
  formSheet: v = !1,
  enableCMDS: Q = !0
}) => {
  const C = oe(), { setGlobalDirtyState: ee } = be(), [te, de] = B(!1);
  z(() => {
    ee(R);
  }, [R, ee]), z(() => {
    const g = (L) => {
      L.key === "Escape" && (document.activeElement && document.activeElement instanceof HTMLElement && document.activeElement.blur(), setTimeout(() => {
        y ? y() : ne(R, () => {
          C.remove(), M == null || M();
        });
      }), L.stopPropagation());
    };
    return document.addEventListener("keydown", g), () => {
      document.removeEventListener("keydown", g);
    };
  }, [C, R, M, y]), z(() => {
    const g = setTimeout(() => {
      de(!0);
    }, 250);
    return () => clearTimeout(g);
  }, []), z(() => {
    if (F) {
      const g = (L) => {
        (L.metaKey || L.ctrlKey) && L.key === "s" && (L.preventDefault(), F());
      };
      if (Q)
        return window.addEventListener("keydown", g), () => {
          window.removeEventListener("keydown", g);
        };
    }
  });
  const W = [];
  let O;
  const J = () => {
    ne(R, () => {
      C.remove(), M == null || M();
    });
  };
  l || (c && W.push({
    key: "cancel-modal",
    label: c,
    color: "outline",
    onClick: y || (() => {
      J();
    }),
    disabled: w
  }), i && W.push({
    key: "ok-modal",
    label: i,
    color: U,
    className: "min-w-[80px]",
    onClick: F,
    disabled: w || k,
    loading: u
  }));
  let m = n(
    "relative z-50 mx-auto flex max-h-[100%] w-full flex-col justify-between overflow-x-hidden bg-white dark:bg-black",
    o !== "bleed" && "rounded",
    v ? "shadow-md" : "shadow-xl",
    P && !v && !te && "animate-modal-in",
    v && !te && "animate-modal-in-reverse",
    q ? "overflow-y-auto" : "overflow-y-hidden"
  ), p = n(
    "fixed inset-0 z-[1000] h-[100vh] w-[100vw]"
  ), b = "", d = n(
    !f || f === "close" ? "" : "flex items-center justify-between gap-5"
  );
  switch ($ && (d = n(
    d,
    "sticky top-0 z-[200] -mb-4 bg-white !pb-4 dark:bg-black"
  )), o) {
    case "sm":
      m = n(
        m,
        "max-w-[480px]"
      ), p = n(
        p,
        "p-4 md:p-[8vmin]"
      ), b = "p-8", d = n(
        d,
        "-inset-x-8"
      );
      break;
    case "md":
      m = n(
        m,
        "max-w-[720px]"
      ), p = n(
        p,
        "p-4 md:p-[8vmin]"
      ), b = "p-8", d = n(
        d,
        "-inset-x-8"
      );
      break;
    case "lg":
      m = n(
        m,
        "max-w-[1020px]"
      ), p = n(
        p,
        "p-4 md:p-[4vmin]"
      ), b = "p-7", d = n(
        d,
        "-inset-x-8"
      );
      break;
    case "xl":
      m = n(
        m,
        "max-w-[1240px]0"
      ), p = n(
        p,
        "p-4 md:p-[3vmin]"
      ), b = "p-10", d = n(
        d,
        "-inset-x-10 -top-10"
      );
      break;
    case "full":
      m = n(
        m,
        "h-full"
      ), p = n(
        p,
        "p-4 md:p-[3vmin]"
      ), b = "p-10", d = n(
        d,
        "-inset-x-10"
      );
      break;
    case "bleed":
      m = n(
        m,
        "h-full"
      ), b = "p-10", d = n(
        d,
        "-inset-x-10"
      );
      break;
    default:
      p = n(
        p,
        "p-4 md:p-[8vmin]"
      ), b = "p-8", d = n(
        d,
        "-inset-x-8"
      );
      break;
  }
  j || (b = "p-0"), m = n(
    m
  ), d = n(
    d,
    b,
    "pb-0"
  ), O = n(
    b,
    "py-0"
  ), p = n(
    p,
    "max-[800px]:!pb-20"
  );
  const me = n(
    `${b} ${I ? "py-6" : ""}`,
    "flex w-full items-center justify-between"
  );
  O = n(
    O,
    (o === "full" || o === "bleed" || e === "full" || typeof e == "number") && "grow"
  );
  const pe = (g) => {
    g.target === g.currentTarget && _ && J();
  }, A = {};
  typeof t == "number" ? (A.width = "100%", A.maxWidth = t + "px") : t === "full" && (m = n(
    m,
    "w-full"
  )), typeof e == "number" ? (A.height = "100%", A.maxHeight = e + "px") : e === "full" && (m = n(
    m,
    "h-full"
  ));
  let N;
  return l ? N = l : l === !1 ? O += " pb-0 " : N = /* @__PURE__ */ s.jsxs("div", { className: me, children: [
    /* @__PURE__ */ s.jsx("div", { children: x && /* @__PURE__ */ s.jsx(K, { ...x }) }),
    /* @__PURE__ */ s.jsx("div", { className: "flex gap-3", children: /* @__PURE__ */ s.jsx(we, { buttons: W }) })
  ] }), N = I ? /* @__PURE__ */ s.jsx(Le, { height: 84, children: N }) : /* @__PURE__ */ s.jsx(s.Fragment, { children: N }), /* @__PURE__ */ s.jsxs("div", { className: p, id: "modal-backdrop", onMouseDown: pe, children: [
    /* @__PURE__ */ s.jsx("div", { className: n(
      "pointer-events-none fixed inset-0 z-0",
      H && !v && Ne,
      v && "bg-[rgba(98,109,121,0.08)]"
    ) }),
    /* @__PURE__ */ s.jsxs("section", { className: m, "data-testid": r, style: A, children: [
      h === !1 ? "" : !f || f === "close" ? /* @__PURE__ */ s.jsxs("header", { className: d, children: [
        a && /* @__PURE__ */ s.jsx(X, { level: 3, children: a }),
        /* @__PURE__ */ s.jsx("div", { className: `${f !== "close" && "md:!invisible md:!hidden"} ${S && "hidden"} absolute right-6 top-6`, children: /* @__PURE__ */ s.jsx(K, { className: "-m-2 cursor-pointer p-2 opacity-50 hover:opacity-100", icon: "close", iconColorClass: "text-black dark:text-white", size: "sm", testId: "close-modal", unstyled: !0, onClick: J }) })
      ] }) : /* @__PURE__ */ s.jsxs("header", { className: d, children: [
        a && /* @__PURE__ */ s.jsx(X, { level: 3, children: a }),
        f
      ] }),
      /* @__PURE__ */ s.jsx("div", { className: O, children: T }),
      N
    ] })
  ] });
}, Ee = ({
  title: o = "Are you sure?",
  prompt: t,
  cancelLabel: e = "Cancel",
  okLabel: r = "OK",
  okRunningLabel: a = "...",
  okColor: i = "black",
  onCancel: u,
  onOk: c,
  customFooter: l,
  formSheet: h = !0
}) => {
  const x = oe(), [w, k] = B("");
  return /* @__PURE__ */ s.jsx(
    V,
    {
      backDropClick: !1,
      buttonsDisabled: w === "running",
      cancelLabel: e,
      footer: l,
      formSheet: h,
      okColor: i,
      okLabel: w === "running" ? a : r,
      testId: "confirmation-modal",
      title: o,
      width: 540,
      onCancel: u,
      onOk: async () => {
        k("running");
        try {
          await (c == null ? void 0 : c(x));
        } catch (j) {
          console.error("Unhandled Promise Rejection. Make sure you catch errors in your onOk handler.", j);
        }
        k("");
      },
      children: /* @__PURE__ */ s.jsx("div", { className: "py-4 leading-9", children: t })
    }
  );
}, Ue = E.create(Ee);
class Se extends ge {
  constructor(t, e) {
    super(), this.client = t, this.setOptions(e), this.bindMethods(), this.updateResult();
  }
  bindMethods() {
    this.mutate = this.mutate.bind(this), this.reset = this.reset.bind(this);
  }
  setOptions(t) {
    var e;
    const r = this.options;
    this.options = this.client.defaultMutationOptions(t), ye(r, this.options) || this.client.getMutationCache().notify({
      type: "observerOptionsUpdated",
      mutation: this.currentMutation,
      observer: this
    }), (e = this.currentMutation) == null || e.setOptions(this.options);
  }
  onUnsubscribe() {
    if (!this.hasListeners()) {
      var t;
      (t = this.currentMutation) == null || t.removeObserver(this);
    }
  }
  onMutationUpdate(t) {
    this.updateResult();
    const e = {
      listeners: !0
    };
    t.type === "success" ? e.onSuccess = !0 : t.type === "error" && (e.onError = !0), this.notify(e);
  }
  getCurrentResult() {
    return this.currentResult;
  }
  reset() {
    this.currentMutation = void 0, this.updateResult(), this.notify({
      listeners: !0
    });
  }
  mutate(t, e) {
    return this.mutateOptions = e, this.currentMutation && this.currentMutation.removeObserver(this), this.currentMutation = this.client.getMutationCache().build(this.client, {
      ...this.options,
      variables: typeof t < "u" ? t : this.options.variables
    }), this.currentMutation.addObserver(this), this.currentMutation.execute();
  }
  updateResult() {
    const t = this.currentMutation ? this.currentMutation.state : ve(), e = {
      ...t,
      isLoading: t.status === "loading",
      isSuccess: t.status === "success",
      isError: t.status === "error",
      isIdle: t.status === "idle",
      mutate: this.mutate,
      reset: this.reset
    };
    this.currentResult = e;
  }
  notify(t) {
    re.batch(() => {
      if (this.mutateOptions && this.hasListeners()) {
        if (t.onSuccess) {
          var e, r, a, i;
          (e = (r = this.mutateOptions).onSuccess) == null || e.call(r, this.currentResult.data, this.currentResult.variables, this.currentResult.context), (a = (i = this.mutateOptions).onSettled) == null || a.call(i, this.currentResult.data, null, this.currentResult.variables, this.currentResult.context);
        } else if (t.onError) {
          var u, c, l, h;
          (u = (c = this.mutateOptions).onError) == null || u.call(c, this.currentResult.error, this.currentResult.variables, this.currentResult.context), (l = (h = this.mutateOptions).onSettled) == null || l.call(h, void 0, this.currentResult.error, this.currentResult.variables, this.currentResult.context);
        }
      }
      t.listeners && this.listeners.forEach(({
        listener: x
      }) => {
        x(this.currentResult);
      });
    });
  }
}
function ue(o, t, e) {
  const r = ke(o, t, e), a = je({
    context: r.context
  }), [i] = B(() => new Se(a, r));
  z(() => {
    i.setOptions(r);
  }, [i, r]);
  const u = Fe(se((l) => i.subscribe(re.batchCalls(l)), [i]), () => i.getCurrentResult(), () => i.getCurrentResult()), c = se((l, h) => {
    i.mutate(l, h).catch(Oe);
  }, [i]);
  if (u.error && Me(i.options.useErrorBoundary, [u.error]))
    throw u.error;
  return {
    ...u,
    mutate: c,
    mutateAsync: u.mutate
  };
}
function Oe() {
}
function Ae(o, t, e) {
  var c;
  const a = (c = D().data) == null ? void 0 : c.site, i = (a == null ? void 0 : a.url) ?? window.location.origin, u = new G(
    new URL(i),
    new URL("/ghost/api/admin/identities/", window.location.origin),
    o
  );
  return ue({
    async mutationFn(l) {
      return u.follow(l);
    },
    onSuccess: t,
    onError: e
  });
}
const ze = E.create(() => {
  const { updateRoute: o } = Y(), t = E.useModal(), [e, r] = B(""), [a, i] = B(null);
  async function u() {
    Re({
      message: "Site followed",
      type: "success"
    }), t.remove(), o("");
  }
  async function c() {
    i(a);
  }
  const l = Ae("index", u, c);
  return /* @__PURE__ */ s.jsx(
    V,
    {
      afterClose: () => {
        l.reset(), o("");
      },
      cancelLabel: "Cancel",
      okLabel: "Follow",
      size: "sm",
      title: "Follow a Ghost site",
      onOk: () => l.mutate(e),
      children: /* @__PURE__ */ s.jsx("div", { className: "mt-3 flex flex-col gap-4", children: /* @__PURE__ */ s.jsx(
        Ce,
        {
          autoFocus: !0,
          error: !!a,
          hint: a,
          placeholder: "@username@hostname",
          title: "Profile name",
          value: e,
          "data-test-new-follower": !0,
          onChange: (h) => r(h.target.value)
        }
      ) })
    }
  );
});
function Z(o) {
  if (!o.preferredUsername || !o.id)
    return "@unknown@unknown";
  try {
    return `@${o.preferredUsername}@${new URL(o.id).hostname}`;
  } catch {
    return "@unknown@unknown";
  }
}
function Be(o) {
  var i;
  const e = (i = D().data) == null ? void 0 : i.site, r = (e == null ? void 0 : e.url) ?? window.location.origin, a = new G(
    new URL(r),
    new URL("/ghost/api/admin/identities/", window.location.origin),
    o
  );
  return ce({
    queryKey: [`followers:${o}`],
    async queryFn() {
      return a.getFollowers();
    }
  });
}
function Te(o) {
  var i;
  const e = (i = D().data) == null ? void 0 : i.site, r = (e == null ? void 0 : e.url) ?? window.location.origin, a = new G(
    new URL(r),
    new URL("/ghost/api/admin/identities/", window.location.origin),
    o
  );
  return ue({
    async mutationFn(u) {
      return a.follow(u);
    }
  });
}
const He = ({}) => {
  const { updateRoute: o } = Y(), t = Te("index"), { data: e = [] } = Be("index"), r = Array.isArray(e) ? e : [e];
  return /* @__PURE__ */ s.jsx(
    V,
    {
      afterClose: () => {
        t.reset(), o("");
      },
      cancelLabel: "",
      footer: !1,
      okLabel: "",
      size: "md",
      title: "Followers",
      topRightContent: "close",
      children: /* @__PURE__ */ s.jsx("div", { className: "mt-3 flex flex-col gap-4 pb-12", children: /* @__PURE__ */ s.jsx(ie, { children: r.map((a) => /* @__PURE__ */ s.jsx(ae, { action: /* @__PURE__ */ s.jsx(K, { color: "grey", label: "Follow back", link: !0, onClick: () => t.mutate(Z(a)) }), avatar: /* @__PURE__ */ s.jsx(le, { image: a.icon, size: "sm" }), detail: Z(a), id: "list-item", title: a.name })) }) })
    }
  );
}, Ie = E.create(He);
function qe(o) {
  var i;
  const e = (i = D().data) == null ? void 0 : i.site, r = (e == null ? void 0 : e.url) ?? window.location.origin, a = new G(
    new URL(r),
    new URL("/ghost/api/admin/identities/", window.location.origin),
    o
  );
  return ce({
    queryKey: [`following:${o}`],
    async queryFn() {
      return a.getFollowing();
    }
  });
}
const Ke = ({}) => {
  const { updateRoute: o } = Y(), { data: t = [] } = qe("index"), e = Array.isArray(t) ? t : [t];
  return /* @__PURE__ */ s.jsx(
    V,
    {
      afterClose: () => {
        o("");
      },
      cancelLabel: "",
      footer: !1,
      okLabel: "",
      size: "md",
      title: "Following",
      topRightContent: "close",
      children: /* @__PURE__ */ s.jsx("div", { className: "mt-3 flex flex-col gap-4 pb-12", children: /* @__PURE__ */ s.jsx(ie, { children: e.map((r) => /* @__PURE__ */ s.jsx(ae, { action: /* @__PURE__ */ s.jsx(K, { color: "grey", label: "Unfollow", link: !0 }), avatar: /* @__PURE__ */ s.jsx(le, { image: r.icon, size: "sm" }), detail: Z(r), id: "list-item", title: r.name })) }) })
    }
  );
}, De = E.create(Ke), Ve = { FollowSite: ze, ViewFollowing: De, ViewFollowers: Ie };
export {
  Ve as default
};
//# sourceMappingURL=modals-8098b85c.mjs.map
