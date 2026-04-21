; ============================================================
;  CALCULADORA EM ASSEMBLY x86-64 (NASM) — Linux
;
;  Compilar : nasm -f elf64 calculadora.asm -o calculadora.o
;  Linkar   : ld calculadora.o -o calculadora
;  Executar : ./calculadora
; ============================================================

section .data
    prompt_a    db  "Numero A : ", 0
    prompt_op   db  "Operador  (+  -  *  /) : ", 0
    prompt_b    db  "Numero B : ", 0
    msg_result  db  "Resultado : ", 0
    msg_newline db  10, 0
    msg_error   db  "Erro: divisao por zero!", 10, 0
    msg_badop   db  "Erro: operador invalido!", 10, 0

section .bss
    buf_a   resb 32
    buf_op  resb  4
    buf_b   resb 32
    buf_out resb 32

section .text
    global _start

; ──────────────────────────────────────────────────────────
;  PONTO DE ENTRADA
; ──────────────────────────────────────────────────────────
_start:
    ; lê número A
    mov  rdi, prompt_a
    call print_str
    mov  rdi, buf_a
    mov  rsi, 32
    call read_line
    mov  rdi, buf_a
    call parse_int
    mov  r12, rax           ; r12 = A

    ; lê operador
    mov  rdi, prompt_op
    call print_str
    mov  rdi, buf_op
    mov  rsi, 4
    call read_line

    ; lê número B
    mov  rdi, prompt_b
    call print_str
    mov  rdi, buf_b
    mov  rsi, 32
    call read_line
    mov  rdi, buf_b
    call parse_int
    mov  r13, rax           ; r13 = B

    ; despacha operação
    movzx rax, byte [buf_op]

    cmp  al, '+'
    je   .do_add
    cmp  al, '-'
    je   .do_sub
    cmp  al, '*'
    je   .do_mul
    cmp  al, '/'
    je   .do_div

    ; operador inválido
    mov  rdi, msg_badop
    call print_str
    jmp  .exit

.do_add:
    mov  rax, r12
    add  rax, r13
    jmp  .print_result

.do_sub:
    mov  rax, r12
    sub  rax, r13
    jmp  .print_result

.do_mul:
    mov  rax, r12
    imul rax, r13
    jmp  .print_result

.do_div:
    cmp  r13, 0
    je   .div_zero
    mov  rax, r12
    cqo
    idiv r13
    jmp  .print_result

.div_zero:
    mov  rdi, msg_error
    call print_str
    jmp  .exit

.print_result:
    push rax
    mov  rdi, msg_result
    call print_str
    pop  rax
    mov  rdi, buf_out
    call int_to_str
    mov  rdi, buf_out
    call print_str
    mov  rdi, msg_newline
    call print_str

.exit:
    mov  rax, 60
    xor  rdi, rdi
    syscall

; ============================================================
;  print_str — escreve string terminada em 0 no stdout
;  Entrada: RDI = ponteiro para string
; ============================================================
print_str:
    push rdi
    call str_len
    mov  rdx, rax
    pop  rsi
    mov  rax, 1
    mov  rdi, 1
    syscall
    ret

; ============================================================
;  str_len — comprimento de string terminada em 0
;  Entrada: RDI = ponteiro  |  Saída: RAX = comprimento
; ============================================================
str_len:
    xor  rax, rax
.loop:
    cmp  byte [rdi + rax], 0
    je   .done
    inc  rax
    jmp  .loop
.done:
    ret

; ============================================================
;  read_line — lê linha do stdin, substitui \n por 0
;  Entrada: RDI = buffer, RSI = tamanho máximo
; ============================================================
read_line:
    push rdi
    push rsi
    mov  rdx, rsi
    mov  rsi, rdi
    mov  rax, 0
    mov  rdi, 0
    syscall
    pop  rsi
    pop  rdi
    mov  rcx, rax
    dec  rcx
    mov  byte [rdi + rcx], 0
    ret

; ============================================================
;  parse_int — converte string ASCII para inteiro com sinal
;  Entrada: RDI = string  |  Saída: RAX = inteiro
; ============================================================
parse_int:
    xor  rax, rax
    xor  rcx, rcx
    mov  r8, 1              ; sinal padrão: +1

    cmp  byte [rdi], '-'
    jne  .parse_loop
    mov  r8, -1
    inc  rcx

.parse_loop:
    movzx rdx, byte [rdi + rcx]
    cmp  dl, 0
    je   .parse_done
    sub  dl, '0'
    imul rax, 10
    add  rax, rdx
    inc  rcx
    jmp  .parse_loop

.parse_done:
    imul rax, r8
    ret

; ============================================================
;  int_to_str — converte inteiro com sinal para string ASCII
;  Entrada: RAX = inteiro, RDI = buffer destino
; ============================================================
int_to_str:
    push rbx
    push rdi
    mov  rbx, rdi
    add  rbx, 30
    mov  byte [rbx + 1], 0
    mov  byte [rbx], 0

    xor  r9, r9             ; flag negativo
    cmp  rax, 0
    jge  .cvt_loop
    mov  r9, 1
    neg  rax

.cvt_loop:
    xor  rdx, rdx
    mov  rcx, 10
    div  rcx
    add  dl, '0'
    mov  [rbx], dl
    dec  rbx
    cmp  rax, 0
    jne  .cvt_loop

    cmp  r9, 1
    jne  .cvt_copy
    mov  byte [rbx], '-'
    dec  rbx

.cvt_copy:
    inc  rbx
    pop  rdi
    push rdi
.copy_loop:
    mov  al, [rbx]
    mov  [rdi], al
    cmp  al, 0
    je   .copy_done
    inc  rbx
    inc  rdi
    jmp  .copy_loop
.copy_done:
    pop  rdi
    pop  rbx
    ret
