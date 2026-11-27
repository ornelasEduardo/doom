# WebGPU comparison

The comparison measures the chart renderers on one Apple M3 Max using Playwright Chromium 151.0.7922.34, channel `chromium`, with `--use-angle=metal`. It is a local diagnostic, not a browser-wide performance guarantee. The final tables below compare the preserved WebGL source with the selected optimized WebGPU source in consecutive runs, after other agent CPU/GPU validation work stopped.

## Reproduction

Preserve baseline commit `36e7a5f` in a separate checkout or extract it with `git archive`, install the same locked dependencies (a local `node_modules` symlink is sufficient for this diagnostic), and start its Vite proof server. Start the current checkout's proof server on another port. Run the current harness against both servers, sequentially, with no concurrent browser tests:

```sh
PROOF_URL=http://127.0.0.1:63419 PROOF_HARDWARE=1 BENCH_BACKEND=webgl2 BENCH_REVISION=36e7a5f node experiments/chart-d3-bridge/benchmarks/backend-comparison.mjs experiments/chart-d3-bridge/benchmarks/results/webgl2-recheck.json
PROOF_URL=http://127.0.0.1:63420 PROOF_HARDWARE=1 BENCH_BACKEND=webgpu node experiments/chart-d3-bridge/benchmarks/backend-comparison.mjs experiments/chart-d3-bridge/benchmarks/results/webgpu.json
node experiments/chart-d3-bridge/benchmarks/backend-probe.mjs experiments/chart-d3-bridge/benchmarks/results/backend-probe.json
```

The baseline server must serve the baseline source. Changing `BENCH_BACKEND` does not select an alternate renderer inside the current library. The current library has no WebGL fallback. The old `gpu-stress`, `system-stress`, and `projection-probe` diagnostics are explicitly guarded historical tools for that archived server; the comparison harness supersedes their renderer timing for current WebGPU.

## Method and limitations

- All workloads use a 1200 × 700 canvas at DPR 1 and deterministic numeric positions. Each phase discards five warmups and records 60 samples; median and p95 use the sorted sample at `floor((n - 1) × p)`.
- Small scatter has 1,000 points; styled points has 10,000 with variable radius, stroke, affine transforms, opacity and selection emphasis; dense scatter has 1,000,000 points. These three use standalone point renderers with sample count 1 on both backends.
- Mixed vector/scatter has 30 bars, a 200-vertex line and area, and 10,000 points on one canvas. The vector renderer is created first so both backends use MSAA 4. Current WebGPU batches vector/point passes in one surface frame, matching the chart scene architecture. This is a real mixed renderer workload, but excludes React Chart bookkeeping, axes, tooltip, data preparation and spatial indexing.
- `initial-upload` replaces the source identity on an initialized renderer. It measures repeated full-buffer upload and draw, **not cold page startup**. Setup and the first draw are recorded separately as single observations, without a claimed distribution. Modules and the adapter probe have already run; these are first draws for each new renderer, not fresh-browser cold starts. `update-256` changes and patches 256 contiguous slots. `panzoom` keeps buffers resident while changing the view.
- CPU submission measures synchronous patch/draw work. It is **not GPU execution time**. Completed wall time includes submission and a one-pixel readback: WebGL `readPixels`, versus WebGPU queue completion followed by texture copy/map. Different synchronization/readback costs limit direct attribution to rendering. WebGPU queue-only completion is recorded separately before readback. No isolated GPU timestamp-query metric is claimed.
- RAF intervals include browser scheduling and the benchmark's synchronization. Earlier checkpoints scheduled at approximately 33.3 ms, while the final baseline/optimized pair both scheduled at approximately 8.3 ms; these are not compositor presentation timestamps and do not establish interactive frame rate.
- Browser timing resolution, driver caches, thermal state and other OS activity affect small values and first-draw observations. Single-session comparisons do not establish statistical significance. Repeated local runs showed appreciable variation even at the same RAF cadence; retain the raw checkpoints rather than treating a single small difference as conclusive. JS heap, GPU memory consumption, browser startup, mobile/integrated GPU behavior, and end-to-end page responsiveness were not measured.
- Every WebGPU completion checks the renderer/surface availability and errors; a validation failure aborts rather than allowing no-op draws to appear fast. The Vite surface module is resolved using the renderer's transformed import URL so live-reload module identities cannot accidentally create a second device during readback.

## Browser availability

The checked-in `results/backend-probe.json` records the actual probe, not just `navigator.gpu` presence:

| Local engine                                          | WebGPU adapter         | Reported backend                               |
| ----------------------------------------------------- | ---------------------- | ---------------------------------------------- |
| Chromium 151 default headless                         | unavailable            | WebGL SwiftShader software                     |
| Chromium 151 full browser channel + Metal             | available, nonfallback | Apple / metal-3; WebGL identifies Apple M3 Max |
| Firefox 153                                           | unavailable            | `navigator.gpu` exists, adapter is null        |
| Firefox 153 with WebGPU enabled and blocklist ignored | unavailable            | adapter is still null                          |
| WebKit 26.5                                           | available, nonfallback | Apple GPU                                      |

Adapter availability is not a passing rendering regression test. Unsupported Firefox GPU paths must be reported as unavailable/skipped, while non-GPU interaction coverage can still run. Software and hardware runs are not interchangeable.

## Final selected implementation

The retained optimizations use four-vertex triangle strips and instanced vertex input for point positions, batch vector shapes into a render pass, and resolve multisampled surfaces only at submission or before a required texture read. Consecutive SVG vector marks are also grouped by the scene, but that extra scene-level benefit is outside this renderer-only harness.

The original `webgl2-baseline.json` and `webgpu-initial.json` are preserved. The final comparison uses `webgl2-recheck.json` and `webgpu.json`; it does not overwrite the original baseline checkpoint.

## Recorded results

Sequential run timestamps: WebGL `2026-11-27T21:25:18.051Z`, WebGPU `2026-11-27T21:25:25.389Z`. Values below are milliseconds, **median / p95**. Raw JSON preserves full precision and RAF samples.

| Workload             | Phase          |   WebGL CPU |  WebGPU CPU | WebGL completed + readback | WebGPU completed + readback | WebGPU queue-only completed |
| -------------------- | -------------- | ----------: | ----------: | -------------------------: | --------------------------: | --------------------------: |
| small-scatter        | initial-upload | 0.10 / 0.30 | 0.20 / 0.40 |                1.40 / 2.80 |                 2.10 / 3.10 |                 1.60 / 2.20 |
| small-scatter        | update-256     | 0.30 / 0.60 | 0.30 / 0.50 |                2.20 / 3.40 |                 2.10 / 3.40 |                 1.60 / 2.50 |
| small-scatter        | panzoom        | 0.20 / 0.30 | 0.20 / 0.40 |                3.00 / 3.50 |                 2.70 / 3.80 |                 2.00 / 2.90 |
| styled-mixed-points  | initial-upload | 0.60 / 0.90 | 0.60 / 1.10 |                3.30 / 4.00 |                 2.40 / 4.80 |                 2.00 / 3.90 |
| styled-mixed-points  | update-256     | 0.40 / 0.70 | 0.50 / 0.70 |                3.00 / 3.70 |                 3.70 / 4.20 |                 2.70 / 3.10 |
| styled-mixed-points  | panzoom        | 0.10 / 0.20 | 0.20 / 0.30 |                2.40 / 3.40 |                 2.80 / 3.50 |                 2.10 / 2.50 |
| dense-scatter        | initial-upload | 1.70 / 2.50 | 1.00 / 1.20 |                5.80 / 7.90 |                6.40 / 10.60 |                6.10 / 10.10 |
| dense-scatter        | update-256     | 0.50 / 1.00 | 0.30 / 0.50 |                5.30 / 7.70 |                7.10 / 10.60 |                 6.30 / 9.70 |
| dense-scatter        | panzoom        | 0.10 / 0.20 | 0.20 / 0.40 |                3.90 / 5.60 |                 5.90 / 9.30 |                 5.10 / 8.10 |
| mixed-vector-scatter | initial-upload | 0.80 / 1.50 | 0.80 / 1.90 |                3.10 / 5.00 |                 4.40 / 5.30 |                 4.00 / 4.90 |
| mixed-vector-scatter | update-256     | 0.80 / 1.90 | 1.00 / 1.30 |                3.70 / 7.90 |                 5.20 / 6.10 |                 4.80 / 5.50 |
| mixed-vector-scatter | panzoom        | 1.20 / 1.60 | 0.70 / 1.60 |                4.20 / 5.20 |                 3.60 / 5.00 |                 3.30 / 4.40 |

First-draw observations (one per workload; setup and first draw are separate stages):

| Workload             | WebGL setup | WebGPU setup | WebGL first draw completed + readback | WebGPU first draw completed + readback |
| -------------------- | ----------: | -----------: | ------------------------------------: | -------------------------------------: |
| small-scatter        |       16.00 |         3.50 |                                  2.60 |                                   5.30 |
| styled-mixed-points  |        9.60 |         2.50 |                                  8.40 |                                   7.00 |
| dense-scatter        |        4.10 |         1.90 |                                 10.60 |                                  25.00 |
| mixed-vector-scatter |       12.70 |         5.40 |                                 11.60 |                                   9.80 |

The current implementation does **not** establish an overall performance improvement. Read the CPU and completed-work columns separately: lower submission overhead in a workload does not imply faster completed rendering. The final pair still shows completed-work penalties in dense and mixed workloads; the queue-only columns show how much of that cost precedes the readback. The migration should be justified by API/architecture goals and validated visual behavior, not a claimed universal speedup.

## Optimization checkpoints

Queue-completed wall time, milliseconds **median / p95** (includes CPU submission, excludes the subsequent readback):

| Workload             | Phase          | Initial WebGPU | Four-vertex strip | Strip + batched vector/resolve | Selected final |
| -------------------- | -------------- | -------------: | ----------------: | -----------------------------: | -------------: |
| dense-scatter        | initial-upload |   8.80 / 12.30 |      9.50 / 13.60 |                   9.50 / 11.00 |   6.10 / 10.10 |
| dense-scatter        | update-256     |   7.70 / 11.80 |       6.40 / 9.40 |                   7.40 / 11.00 |    6.30 / 9.70 |
| dense-scatter        | panzoom        |    6.20 / 9.70 |       4.80 / 7.30 |                    5.10 / 8.10 |    5.10 / 8.10 |
| mixed-vector-scatter | initial-upload |   7.60 / 11.90 |      7.70 / 11.20 |                    5.30 / 8.90 |    4.00 / 4.90 |
| mixed-vector-scatter | update-256     |   9.60 / 12.60 |      7.20 / 10.30 |                    5.50 / 8.10 |    4.80 / 5.50 |
| mixed-vector-scatter | panzoom        |   8.80 / 12.90 |      7.30 / 10.50 |                    5.60 / 8.30 |    3.30 / 4.40 |

The first three checkpoints used the approximately 33.3 ms RAF cadence. In that exploratory series, vector batching/deferred resolve reduced mixed queue median time from the strip-only checkpoint's 7.7/7.2/7.3 ms (upload/update/panzoom) to 5.3/5.5/5.6 ms. These are observed reductions, not isolated GPU-duration measurements or a statistical guarantee.

The host/browser cadence changed to approximately 8.3 ms at the hardware vertex-input experiment and stayed there for the final pair. **Do not attribute the entire initial-to-final reduction to code changes.** The final WebGL-versus-WebGPU table uses the new cadence on both backends; that comparison still exposes remaining penalties rather than claiming they were eliminated.

Two three-vertex point candidates (right-triangle and tighter equilateral-circle bounds) and a direct convex-vector fill path were correctness-tested and measured, then reverted because they did not consistently improve the workloads. Their raw `webgpu-triangle3.json`, `webgpu-equilateral3.json`, and `webgpu-direct-convex.json` observations are retained. `webgpu-vertex4.json` and `webgpu-vertex4-recheck.json` retain intermediate four-vertex observations; neither replaces the final pair.
