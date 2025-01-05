<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<div class="min-h-screen bg-slate-100">
	<div class="max-w-8xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
		<div class="rounded-lg bg-white p-6 shadow-sm">
			<div class="prose prose-blue max-w-none">
				{@render children()}
			</div>
		</div>
	</div>
</div>
