.set IMAGE_BASE, 0x140000000

.section .idata$2,"aw"
.align 4
kernel_descriptor:
  .long kernel_ilt - IMAGE_BASE
  .long 0
  .long 0
  .long kernel_name - IMAGE_BASE
  .long kernel_iat - IMAGE_BASE
shell_descriptor:
  .long shell_ilt - IMAGE_BASE
  .long 0
  .long 0
  .long shell_name - IMAGE_BASE
  .long shell_iat - IMAGE_BASE
user_descriptor:
  .long user_ilt - IMAGE_BASE
  .long 0
  .long 0
  .long user_name - IMAGE_BASE
  .long user_iat - IMAGE_BASE

.section .idata$3,"aw"
  .fill 20, 1, 0

.section .idata$4,"aw"
.align 8
kernel_ilt:
  .quad hint_GetTempPathW - IMAGE_BASE
  .quad hint_CreateFileW - IMAGE_BASE
  .quad hint_WriteFile - IMAGE_BASE
  .quad hint_CloseHandle - IMAGE_BASE
  .quad hint_ExitProcess - IMAGE_BASE
  .quad 0
shell_ilt:
  .quad hint_ShellExecuteW - IMAGE_BASE
  .quad 0
user_ilt:
  .quad hint_MessageBoxW - IMAGE_BASE
  .quad 0

.section .idata$5,"aw"
.align 8
kernel_iat:
.global __imp_GetTempPathW
__imp_GetTempPathW:
  .quad hint_GetTempPathW - IMAGE_BASE
.global __imp_CreateFileW
__imp_CreateFileW:
  .quad hint_CreateFileW - IMAGE_BASE
.global __imp_WriteFile
__imp_WriteFile:
  .quad hint_WriteFile - IMAGE_BASE
.global __imp_CloseHandle
__imp_CloseHandle:
  .quad hint_CloseHandle - IMAGE_BASE
.global __imp_ExitProcess
__imp_ExitProcess:
  .quad hint_ExitProcess - IMAGE_BASE
  .quad 0
shell_iat:
.global __imp_ShellExecuteW
__imp_ShellExecuteW:
  .quad hint_ShellExecuteW - IMAGE_BASE
  .quad 0
user_iat:
.global __imp_MessageBoxW
__imp_MessageBoxW:
  .quad hint_MessageBoxW - IMAGE_BASE
  .quad 0

.section .idata$6,"aw"
.align 2
hint_GetTempPathW:
  .short 0
  .asciz "GetTempPathW"
.align 2
hint_CreateFileW:
  .short 0
  .asciz "CreateFileW"
.align 2
hint_WriteFile:
  .short 0
  .asciz "WriteFile"
.align 2
hint_CloseHandle:
  .short 0
  .asciz "CloseHandle"
.align 2
hint_ExitProcess:
  .short 0
  .asciz "ExitProcess"
.align 2
hint_ShellExecuteW:
  .short 0
  .asciz "ShellExecuteW"
.align 2
hint_MessageBoxW:
  .short 0
  .asciz "MessageBoxW"

.section .idata$7,"aw"
kernel_name:
  .asciz "KERNEL32.dll"
shell_name:
  .asciz "SHELL32.dll"
user_name:
  .asciz "USER32.dll"
