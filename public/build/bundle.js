
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/App.svelte generated by Svelte v3.31.0 */

    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let div6;
    	let div5;
    	let section0;
    	let div0;
    	let h10;
    	let span0;
    	let t0;
    	let span1;
    	let t2;
    	let span2;
    	let t3;
    	let div3;
    	let div1;
    	let t5;
    	let div2;
    	let t7;
    	let section1;
    	let div4;
    	let h11;
    	let strong;
    	let t9;
    	let nav;
    	let ul;
    	let li0;
    	let a0;
    	let t11;
    	let li1;
    	let a1;
    	let t13;
    	let li2;
    	let a2;

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			div5 = element("div");
    			section0 = element("section");
    			div0 = element("div");
    			h10 = element("h1");
    			span0 = element("span");
    			t0 = space();
    			span1 = element("span");
    			span1.textContent = "is better than";
    			t2 = space();
    			span2 = element("span");
    			t3 = space();
    			div3 = element("div");
    			div1 = element("div");
    			div1.textContent = "Random";
    			t5 = space();
    			div2 = element("div");
    			div2.textContent = "Edit";
    			t7 = space();
    			section1 = element("section");
    			div4 = element("div");
    			h11 = element("h1");
    			strong = element("strong");
    			strong.textContent = "Horizontal Resume";
    			t9 = space();
    			nav = element("nav");
    			ul = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "Lorem";
    			t11 = space();
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "Ipsum";
    			t13 = space();
    			li2 = element("li");
    			a2 = element("a");
    			a2.textContent = "Dolor";
    			attr_dev(span0, "class", "first svelte-1x7f0j9");
    			add_location(span0, file, 116, 5, 1726);
    			attr_dev(span1, "class", "template svelte-1x7f0j9");
    			add_location(span1, file, 117, 5, 1759);
    			attr_dev(span2, "class", "second svelte-1x7f0j9");
    			add_location(span2, file, 118, 5, 1809);
    			attr_dev(h10, "class", "sentence svelte-1x7f0j9");
    			add_location(h10, file, 115, 4, 1698);
    			attr_dev(div0, "class", "container svelte-1x7f0j9");
    			add_location(div0, file, 114, 3, 1670);
    			attr_dev(div1, "class", "random btn svelte-1x7f0j9");
    			add_location(div1, file, 122, 4, 1887);
    			attr_dev(div2, "class", "edit btn svelte-1x7f0j9");
    			add_location(div2, file, 125, 4, 1939);
    			attr_dev(div3, "class", "actions svelte-1x7f0j9");
    			add_location(div3, file, 121, 3, 1861);
    			attr_dev(section0, "class", "svelte-1x7f0j9");
    			add_location(section0, file, 113, 2, 1657);
    			attr_dev(strong, "class", "svelte-1x7f0j9");
    			add_location(strong, file, 133, 4, 2053);
    			attr_dev(h11, "class", "svelte-1x7f0j9");
    			add_location(h11, file, 132, 4, 2044);
    			attr_dev(a0, "href", "#");
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "class", "svelte-1x7f0j9");
    			add_location(a0, file, 138, 6, 2153);
    			attr_dev(li0, "class", "svelte-1x7f0j9");
    			add_location(li0, file, 137, 6, 2142);
    			attr_dev(a1, "href", "#");
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "class", "svelte-1x7f0j9");
    			add_location(a1, file, 141, 6, 2220);
    			attr_dev(li1, "class", "svelte-1x7f0j9");
    			add_location(li1, file, 140, 6, 2209);
    			attr_dev(a2, "href", "#");
    			attr_dev(a2, "class", "svelte-1x7f0j9");
    			add_location(a2, file, 144, 6, 2287);
    			attr_dev(li2, "class", "svelte-1x7f0j9");
    			add_location(li2, file, 143, 6, 2276);
    			attr_dev(ul, "class", "svelte-1x7f0j9");
    			add_location(ul, file, 136, 5, 2131);
    			attr_dev(nav, "role", "navigation");
    			attr_dev(nav, "class", "svelte-1x7f0j9");
    			add_location(nav, file, 135, 4, 2102);
    			attr_dev(div4, "class", "text svelte-1x7f0j9");
    			add_location(div4, file, 131, 3, 2021);
    			attr_dev(section1, "class", "svelte-1x7f0j9");
    			add_location(section1, file, 130, 2, 2008);
    			attr_dev(div5, "class", "slider svelte-1x7f0j9");
    			add_location(div5, file, 111, 1, 1586);
    			set_style(div6, "overflow", "hidden");
    			set_style(div6, "height", "100%");
    			attr_dev(div6, "class", "svelte-1x7f0j9");
    			add_location(div6, file, 110, 0, 1539);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div5);
    			append_dev(div5, section0);
    			append_dev(section0, div0);
    			append_dev(div0, h10);
    			append_dev(h10, span0);
    			append_dev(h10, t0);
    			append_dev(h10, span1);
    			append_dev(h10, t2);
    			append_dev(h10, span2);
    			append_dev(section0, t3);
    			append_dev(section0, div3);
    			append_dev(div3, div1);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			append_dev(div5, t7);
    			append_dev(div5, section1);
    			append_dev(section1, div4);
    			append_dev(div4, h11);
    			append_dev(h11, strong);
    			append_dev(div4, t9);
    			append_dev(div4, nav);
    			append_dev(nav, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a0);
    			append_dev(ul, t11);
    			append_dev(ul, li1);
    			append_dev(li1, a1);
    			append_dev(ul, t13);
    			append_dev(ul, li2);
    			append_dev(li2, a2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
