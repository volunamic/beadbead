<script lang="ts">
    import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
    import { buttonVariants } from "$lib/components/ui/button/index.js";
    import { Trash2 } from "@lucide/svelte";
    import { beadsStore } from "$lib/beads/stores.svelte";

    let open = $state(false);

  function handleReset() {
    beadsStore.resetAll();
    open = false;
    // gridSize = 20;
    // layoutRotation = 90;
  }

</script>
<div class="cell-reset-button ml-auto">
    <AlertDialog.Root open={open} onOpenChange={() => open = !open} >
      <AlertDialog.Trigger class={buttonVariants({ variant: "destructive", size: "icon" })}>
            <Trash2 />
      </AlertDialog.Trigger>
      <AlertDialog.Content>
        <AlertDialog.Header>
          <AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
          <AlertDialog.Description>
            This will reset the canvas to blank.
          </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
          <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
          <AlertDialog.Action onclick={handleReset} class={buttonVariants({ variant: "destructive" })}>Yes</AlertDialog.Action>
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog.Root>
    </div>