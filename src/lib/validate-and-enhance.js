// @ts-check

/**
 * @typedef {import('./types').FormField} FormField
 * @typedef {import('./types').FormStore} FormStore
 * @typedef {import('./types').ValidateAndEnhanceOptions} ValidateAndEnhanceOptions
 */

import D from 'debug';
import {applyAction, enhance} from '$app/forms';
import {writable} from 'svelte/store';

const filter = Array.prototype.filter;
const debug = D('debug:ValidateAndEnhance');
const warn = D('warn:ValidateAndEnhance');

/** @type {Record<string, FormStore>} */
const STORES = {};

/**
 * @param {HTMLFormElement} form
 * @param {ValidateAndEnhanceOptions} opts
 * @return import('svelte/types/runtime/action').ActionReturn}
 */
function enhanceIfValid(form, opts) {
  return enhance(form, async ({cancel, submitter}) => {

    // Validate form, unless we are loading initial data
    const button = submitter instanceof HTMLButtonElement ? submitter : form.querySelector('button:not([disabled])');
    if (!button?.hasAttribute('formnovalidate')) {
      for (const input of form.querySelectorAll('input:not([disabled]):not([readonly]), select')) {
        if (input instanceof HTMLInputElement) input.checkValidity();
      }

      if (!form.checkValidity()) {
        warn('form[id="%s"].checkValidity() === false', form.id);
        return cancel();
      }
    }

    // Change form state before submitting
    if (button) button.setAttribute('disabled', 'true');
    form.setAttribute('aria-busy', 'true');
    debug('form[id="%s"].submit()', form.id);

    /// Submit the form and handle response
    return async ({result}) => {
      form.setAttribute('aria-busy', 'false');
      if (button) button.removeAttribute('disabled');
      if (result.type === 'success' || result.type === 'failure') opts.store?.set(result);
      return await applyAction(result);
    };
  });
}

/**
 * Get a Form store representing the data returned from a Sveltekit action.
 *
 * @param {string} name - Name of the form. Ex: form.id
 * @returns {FormStore} A writable svelte store
 */
export function getFormStore(name) {
  return STORES[name] || (STORES[name] = writable({type: 'initial', status: 0, data: {fields: {}}}));
}

/**
 * Removes a Form store
 *
 * @param {string} name - Name of the form. Ex: form.id
 */
export function removeFormStore(name) {
  debug('removeFormStore(%s)', name);
  delete STORES[name];
}

/**
 * @param {HTMLInputElement} input
 * @param {keyof HTMLInputElement} attr
 * @param {string | boolean} value
 * @returns {number}
 */
function setMaybe(input, attr, value) {
  if (input[attr] === value) return 0;
  // @ts-expect-error
  input[attr] = value;
  return 1;
}

/**
 * @param {HTMLFormElement} form
 * @param {ValidateAndEnhanceOptions} opts
 * @return import('svelte/types/runtime/action').ActionReturn}
 */
function updateFieldsWhenStoreUpdates(form, opts) {
  const unsubsribe = opts.store?.subscribe(($store) => {
    const type = $store.type;
    const fields = (type === 'initial' || type === 'failure' || type === 'success') && $store.data?.fields;
    if (!fields) return debug('form[id="%s"] store(%s) does not have data.fields', form.id, $store.type);

    for (const [name, field] of Object.entries(fields)) {
      let changed = 0;

      /** @type {NodeListOf<HTMLInputElement>} */
      const inputs = form.querySelectorAll(`[name="${name}"]`);

      /** @type {HTMLInputElement | undefined} */
      let input = inputs[0];
      if (!input) {
        warn('updateFieldsWhenStoreUpdates() could not find input[name="%s"] in form[id="%s"]', name, form.id);
        continue;
      }

      // Update input attributes
      if (typeof field.placeholder !== 'undefined') {
        if (input) setMaybe(input, 'placeholder', field.placeholder);
      }
      if (typeof field.checked !== 'undefined') {
        if (typeof field.checked !== 'boolean') input = filter.call(inputs, (i) => i.value === field.checked)[0];
        if (input) changed += setMaybe(input, 'checked', field.checked === false ? false : true);
      }
      if (typeof field.value !== 'undefined') {
        if (input) changed += setMaybe(input, 'value', field.value);
      }
      if (typeof field.error !== 'undefined') {
        if (input) input.setCustomValidity(field.error);
      }

      if (changed && input) {
        input.dispatchEvent(new CustomEvent('svelte:sync', {detail: {attrs: Object.keys(field)}}));
      }
    }
  });

  return {
    destroy() {
      if (unsubsribe) unsubsribe();
    }
  };
}

/**
 * A Svelte action that validates and submits a form.
 *
 * @param {HTMLFormElement} form
 * @param {ValidateAndEnhanceOptions=} opts
 * @return import('svelte/types/runtime/action').ActionReturn}
 */
export function validateAndEnhance(form, opts = {}) {
  if (!form.id) form.id = form.action.replace(/\W/g, '_');
  if (!opts.store) opts.store = getFormStore(form.id);

  debug('form[id="%s"].novalidate === true', form.id);
  form.setAttribute('novalidate', 'novalidate');
  const enhancer = enhanceIfValid(form, opts);
  const updater = updateFieldsWhenStoreUpdates(form, opts);

  return {
    destroy() {
      if (opts.cleanup === true) removeFormStore(form.id);
      enhancer.destroy();
      updater.destroy();
    },
  };
}
