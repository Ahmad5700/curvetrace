#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "$0")" && pwd)"
build_dir="$project_dir/build"
dist_dir="$project_dir/dist"

mkdir -p "$build_dir" "$dist_dir"
node "$project_dir/tools_bundle.js"
node "$project_dir/tests/core.test.js"
node "$project_dir/tests/structure.test.js"

g++ -std=c++17 -O2 -c "$project_dir/launcher/launcher.cpp" \
  -o "$build_dir/launcher.o" \
  -ffreestanding -fno-exceptions -fno-rtti -fno-stack-protector \
  -fno-asynchronous-unwind-tables -fno-unwind-tables -fno-builtin \
  -fno-pic -fno-pie -fcf-protection=none -mcmodel=large -mno-red-zone \
  -ffunction-sections -fdata-sections

objcopy --remove-section=.comment --remove-section=.note.GNU-stack \
  --remove-section=.note.gnu.property "$build_dir/launcher.o"

as --64 -o "$build_dir/imports.o" "$project_dir/launcher/imports.s"

escaped_html_path="${dist_dir//\\/\\\\}/CurveTrace.html"
printf '.section .rdata,"a"\n.global embedded_html_start\n.global embedded_html_end\nembedded_html_start:\n.incbin "%s"\nembedded_html_end:\n' \
  "$escaped_html_path" > "$build_dir/embedded_html.s"
as --64 -o "$build_dir/embedded_html.o" "$build_dir/embedded_html.s"
objcopy --remove-section=.note.GNU-stack "$build_dir/imports.o"
objcopy --remove-section=.note.GNU-stack "$build_dir/embedded_html.o"

undefined_symbols="$(nm -u "$build_dir/launcher.o" | awk '{print $2}' | sort)"
allowed_symbols="$(printf '%s\n' \
  __imp_CloseHandle __imp_CreateFileW __imp_ExitProcess __imp_GetTempPathW \
  __imp_MessageBoxW __imp_ShellExecuteW __imp_WriteFile \
  embedded_html_end embedded_html_start | sort)"
if [[ "$undefined_symbols" != "$allowed_symbols" ]]; then
  echo "Unexpected launcher dependencies:" >&2
  comm -3 <(printf '%s\n' "$allowed_symbols") <(printf '%s\n' "$undefined_symbols") >&2
  exit 1
fi

ld -mi386pep \
  --image-base 0x140000000 \
  --subsystem windows \
  --major-subsystem-version 6 \
  --minor-subsystem-version 0 \
  --entry _start \
  --nxcompat \
  --disable-dynamicbase \
  --disable-high-entropy-va \
  --disable-reloc-section \
  --file-alignment 512 \
  --section-alignment 4096 \
  -s \
  -o "$dist_dir/CurveTrace.exe" \
  "$build_dir/launcher.o" "$build_dir/embedded_html.o" "$build_dir/imports.o"

file "$dist_dir/CurveTrace.exe"
objdump -p "$dist_dir/CurveTrace.exe" | sed -n '/The Import Tables/,/PE File Base Relocations/p'
(cd "$dist_dir" && sha256sum CurveTrace.exe CurveTrace.html > SHA256SUMS.txt)
echo "Built $dist_dir/CurveTrace.exe"
