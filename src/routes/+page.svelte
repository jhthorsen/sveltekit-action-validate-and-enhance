<script>
import {validateAndEnhance} from '$lib';

/**
 * @param {Event} event
 */
function onChange(event) {
  const input = event.target instanceof HTMLInputElement ? event.target : null;
  if (input) console.log(`changed=${input.name} ${input.type}=${input.value} checked=${input.checked}`);
}
</script>

<h1>Form validate and enhance</h1>

<form id="test" method="POST" use:validateAndEnhance>
  <label>
    Name:
    <input name="name" type="text" required on:change={onChange}>
  </label>

  <label>
    <input name="ok" type="checkbox" on:change={onChange}>
    Is it ok?
  </label>

  <fieldset>
    <legend>Radio</legend>
    <input name="radio_channel" type="radio" value="p1" on:change={onChange}>
    <input name="radio_channel" type="radio" value="p2" on:change={onChange}>
    <input name="radio_channel" type="radio" value="p3" on:change={onChange}>
  </fieldset>

  <button>Submit!</button>
</form>

<style>
label {
  display: block;
}
</style>
