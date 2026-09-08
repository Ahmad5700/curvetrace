// CurveTrace's tiny native launcher. It extracts the embedded offline app to
// the current user's temporary folder and opens it in Edge/Chrome app mode.
// No C runtime is required; only standard Windows system DLLs are imported.

using DWORD = unsigned int;
using UINT = unsigned int;
using BOOL = int;
using HANDLE = void*;
using HWND = void*;
using HINSTANCE = void*;
using WCHAR = char16_t;

#define MSABI __attribute__((ms_abi))

extern "C" {
  extern void* __imp_GetTempPathW;
  extern void* __imp_CreateFileW;
  extern void* __imp_WriteFile;
  extern void* __imp_CloseHandle;
  extern void* __imp_ExitProcess;
  extern void* __imp_ShellExecuteW;
  extern void* __imp_MessageBoxW;
  extern const unsigned char embedded_html_start[];
  extern const unsigned char embedded_html_end[];
}

using GetTempPathWFn = DWORD (MSABI *)(DWORD, WCHAR*);
using CreateFileWFn = HANDLE (MSABI *)(const WCHAR*, DWORD, DWORD, void*, DWORD, DWORD, HANDLE);
using WriteFileFn = BOOL (MSABI *)(HANDLE, const void*, DWORD, DWORD*, void*);
using CloseHandleFn = BOOL (MSABI *)(HANDLE);
using ExitProcessFn = void (MSABI *)(UINT);
using ShellExecuteWFn = HINSTANCE (MSABI *)(HWND, const WCHAR*, const WCHAR*, const WCHAR*, const WCHAR*, int);
using MessageBoxWFn = int (MSABI *)(HWND, const WCHAR*, const WCHAR*, UINT);

static WCHAR temp_path[1024];
static WCHAR launch_arguments[1500];

static unsigned length_of(const WCHAR* value) {
  unsigned length = 0;
  while (value[length]) ++length;
  return length;
}

static bool append_text(WCHAR* destination, unsigned capacity, unsigned& used, const WCHAR* source) {
  for (unsigned index = 0; source[index]; ++index) {
    if (used + 1 >= capacity) return false;
    destination[used++] = source[index];
  }
  destination[used] = 0;
  return true;
}

static void show_error(const WCHAR* message) {
  auto message_box = reinterpret_cast<MessageBoxWFn>(__imp_MessageBoxW);
  message_box(nullptr, message, u"CurveTrace", 0x00000010u);
}

extern "C" void MSABI _start() {
  auto get_temp_path = reinterpret_cast<GetTempPathWFn>(__imp_GetTempPathW);
  auto create_file = reinterpret_cast<CreateFileWFn>(__imp_CreateFileW);
  auto write_file = reinterpret_cast<WriteFileFn>(__imp_WriteFile);
  auto close_handle = reinterpret_cast<CloseHandleFn>(__imp_CloseHandle);
  auto shell_execute = reinterpret_cast<ShellExecuteWFn>(__imp_ShellExecuteW);
  auto exit_process = reinterpret_cast<ExitProcessFn>(__imp_ExitProcess);

  const DWORD path_length = get_temp_path(900, temp_path);
  if (path_length == 0 || path_length >= 900) {
    show_error(u"CurveTrace could not access the Windows temporary folder.");
    exit_process(1);
  }

  unsigned used = length_of(temp_path);
  if (!append_text(temp_path, 1024, used, u"CurveTrace_App.html")) {
    show_error(u"The temporary file path is too long.");
    exit_process(1);
  }

  constexpr DWORD GENERIC_WRITE = 0x40000000u;
  constexpr DWORD FILE_SHARE_READ = 0x00000001u;
  constexpr DWORD CREATE_ALWAYS = 2u;
  constexpr DWORD FILE_ATTRIBUTE_NORMAL = 0x00000080u;
  HANDLE file = create_file(temp_path, GENERIC_WRITE, FILE_SHARE_READ, nullptr,
                            CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, nullptr);
  if (file == reinterpret_cast<HANDLE>(~static_cast<unsigned long long>(0))) {
    show_error(u"CurveTrace could not create its temporary application file.");
    exit_process(1);
  }

  const unsigned long long total_size = static_cast<unsigned long long>(embedded_html_end - embedded_html_start);
  unsigned long long offset = 0;
  bool write_ok = true;
  while (offset < total_size) {
    const unsigned long long remaining = total_size - offset;
    const DWORD request = remaining > 0x40000000ull ? 0x40000000u : static_cast<DWORD>(remaining);
    DWORD written = 0;
    if (!write_file(file, embedded_html_start + offset, request, &written, nullptr) || written == 0) {
      write_ok = false;
      break;
    }
    offset += written;
  }
  close_handle(file);
  if (!write_ok) {
    show_error(u"CurveTrace could not finish writing its temporary application file.");
    exit_process(1);
  }

  unsigned argument_length = 0;
  append_text(launch_arguments, 1500, argument_length, u"--app=\"file:///");
  for (unsigned index = 0; temp_path[index]; ++index) {
    if (argument_length + 2 >= 1500) break;
    const WCHAR character = temp_path[index];
    launch_arguments[argument_length++] = character == u'\\' ? u'/' : character;
  }
  launch_arguments[argument_length++] = u'\"';
  launch_arguments[argument_length] = 0;

  constexpr int SW_SHOWNORMAL = 1;
  auto result = reinterpret_cast<unsigned long long>(
    shell_execute(nullptr, u"open", u"msedge.exe", launch_arguments, nullptr, SW_SHOWNORMAL)
  );
  if (result <= 32) {
    result = reinterpret_cast<unsigned long long>(
      shell_execute(nullptr, u"open", u"chrome.exe", launch_arguments, nullptr, SW_SHOWNORMAL)
    );
  }
  if (result <= 32) {
    result = reinterpret_cast<unsigned long long>(
      shell_execute(nullptr, u"open", temp_path, nullptr, nullptr, SW_SHOWNORMAL)
    );
  }
  if (result <= 32) {
    show_error(u"CurveTrace could not open Edge, Chrome, or the default web browser.");
    exit_process(1);
  }
  exit_process(0);
}
