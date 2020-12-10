
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
    	let div11;
    	let div0;
    	let h1;
    	let t1;
    	let div2;
    	let div1;
    	let t2;
    	let span0;
    	let t4;
    	let div4;
    	let div3;
    	let t5;
    	let span1;
    	let t7;
    	let div6;
    	let div5;
    	let t8;
    	let span2;
    	let t10;
    	let div8;
    	let div7;
    	let t11;
    	let span3;
    	let t13;
    	let div10;
    	let div9;
    	let t14;
    	let span4;

    	const block = {
    		c: function create() {
    			div11 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Hi";
    			t1 = space();
    			div2 = element("div");
    			div1 = element("div");
    			t2 = space();
    			span0 = element("span");
    			span0.textContent = "E";
    			t4 = space();
    			div4 = element("div");
    			div3 = element("div");
    			t5 = space();
    			span1 = element("span");
    			span1.textContent = "I";
    			t7 = space();
    			div6 = element("div");
    			div5 = element("div");
    			t8 = space();
    			span2 = element("span");
    			span2.textContent = "O";
    			t10 = space();
    			div8 = element("div");
    			div7 = element("div");
    			t11 = space();
    			span3 = element("span");
    			span3.textContent = "U";
    			t13 = space();
    			div10 = element("div");
    			div9 = element("div");
    			t14 = space();
    			span4 = element("span");
    			span4.textContent = "!";
    			attr_dev(h1, "class", "svelte-1ltctjk");
    			add_location(h1, file, 2, 4, 78);
    			attr_dev(div0, "class", "horizontal-scroll__block  svelte-1ltctjk");
    			add_location(div0, file, 1, 2, 34);
    			attr_dev(div1, "class", "background svelte-1ltctjk");
    			set_style(div1, "background-image", "url(https://source.unsplash.com/category/technology/1024x758)");
    			add_location(div1, file, 5, 4, 144);
    			attr_dev(span0, "class", "letter svelte-1ltctjk");
    			add_location(span0, file, 6, 4, 267);
    			attr_dev(div2, "class", "horizontal-scroll__block svelte-1ltctjk");
    			add_location(div2, file, 4, 2, 101);
    			attr_dev(div3, "class", "background svelte-1ltctjk");
    			set_style(div3, "background-image", "url(https://source.unsplash.com/category/buildings/1024x758)");
    			add_location(div3, file, 9, 4, 351);
    			attr_dev(span1, "class", "letter svelte-1ltctjk");
    			add_location(span1, file, 10, 4, 473);
    			attr_dev(div4, "class", "horizontal-scroll__block svelte-1ltctjk");
    			add_location(div4, file, 8, 2, 308);
    			attr_dev(div5, "class", "background svelte-1ltctjk");
    			set_style(div5, "background-image", "url(https://source.unsplash.com/category/food/1024x758)");
    			add_location(div5, file, 13, 4, 557);
    			attr_dev(span2, "class", "letter svelte-1ltctjk");
    			add_location(span2, file, 14, 4, 674);
    			attr_dev(div6, "class", "horizontal-scroll__block svelte-1ltctjk");
    			add_location(div6, file, 12, 2, 514);
    			attr_dev(div7, "class", "background svelte-1ltctjk");
    			set_style(div7, "background-image", "url(https://source.unsplash.com/category/people/1024x758)");
    			add_location(div7, file, 17, 4, 758);
    			attr_dev(span3, "class", "letter svelte-1ltctjk");
    			add_location(span3, file, 18, 4, 877);
    			attr_dev(div8, "class", "horizontal-scroll__block svelte-1ltctjk");
    			add_location(div8, file, 16, 2, 715);
    			attr_dev(div9, "class", "background svelte-1ltctjk");
    			set_style(div9, "background-image", "url(https://source.unsplash.com/category/objects/1024x758)");
    			add_location(div9, file, 21, 4, 961);
    			attr_dev(span4, "class", "letter svelte-1ltctjk");
    			add_location(span4, file, 22, 4, 1081);
    			attr_dev(div10, "class", "horizontal-scroll__block svelte-1ltctjk");
    			add_location(div10, file, 20, 2, 918);
    			attr_dev(div11, "class", "horizontal-scroll svelte-1ltctjk");
    			add_location(div11, file, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div11, anchor);
    			append_dev(div11, div0);
    			append_dev(div0, h1);
    			append_dev(div11, t1);
    			append_dev(div11, div2);
    			append_dev(div2, div1);
    			append_dev(div2, t2);
    			append_dev(div2, span0);
    			append_dev(div11, t4);
    			append_dev(div11, div4);
    			append_dev(div4, div3);
    			append_dev(div4, t5);
    			append_dev(div4, span1);
    			append_dev(div11, t7);
    			append_dev(div11, div6);
    			append_dev(div6, div5);
    			append_dev(div6, t8);
    			append_dev(div6, span2);
    			append_dev(div11, t10);
    			append_dev(div11, div8);
    			append_dev(div8, div7);
    			append_dev(div8, t11);
    			append_dev(div8, span3);
    			append_dev(div11, t13);
    			append_dev(div11, div10);
    			append_dev(div10, div9);
    			append_dev(div10, t14);
    			append_dev(div10, span4);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div11);
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
