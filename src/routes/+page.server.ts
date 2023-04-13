import {fail} from '@sveltejs/kit';

import type {Actions} from './$types';
import type {ActionFailureOrResult} from '$lib/types';

export const actions: Actions = {
  async default({request}): Promise<ActionFailureOrResult> {
    const formData = await request.formData();

    const name = String(formData.get('name') || '');
    if (name === 'fail') return fail(400, {fields: {name: {error: 'Fail name'}}});

    await new Promise(resolve => setTimeout(resolve, 350 + 650 * Math.random()));

    return {
      fields: {
        name: {
          placeholder: 'cool beans',
          value: name,
        },
        ok: {
          checked: formData.get('ok') ? false : true,
        },
        radio_channel: {
          checked: 'p' + Math.ceil(3 * Math.random()),
        },
      },
    };
  },
};
