import type {ActionFailure, ActionResult} from '@sveltejs/kit';
import type {Writable} from 'svelte/store';

export type FormField = {
  checked?: boolean | string,
  error?: string,
  placeholder?: string,
  value?: string,
};

export type FormData = {
  [key: string]: any,
  fields: {
    [key: string]: FormField,
  },
};

export type ActionFailureOrResult = FormData | ActionFailure<FormData>;

export type FormResult = ActionResult
  | {type: 'initial', status: 0, data: FormData}
  | {type: 'failure', status: number, data: FormData}
  | {type: 'success', status: number, data: FormData};


export type FormStore = Writable<FormResult>;

export type ValidateAndEnhanceOptions = {
  cleanup?: boolean,
  store?: FormStore,
};
