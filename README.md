# CalcASM — Calculadora em Assembly x86-64

# Calculadora: https://lamarq7eyt.github.io/CalcASM/

Calculadora funcional escrita em **Assembly x86-64 (NASM)** para Linux, com um **visualizador interativo** que mostra a execução das instruções em tempo real diretamente no navegador.

## Arquivos

| Arquivo | Descrição |
|---|---|
| `index.html` | Estrutura HTML do visualizador |
| `style.css` | Estilos (tema terminal verde) |
| `main.js` | Lógica do visualizador e simulação de execução |
| `calculadora.asm` | Código Assembly real, compilável no Linux |

## Visualizador (navegador)

Abra o `index.html` diretamente no navegador. Nenhuma dependência necessária.

- Digite os dois números
- Escolha o operador (`+` `-` `*` `/`)
- Clique em **▶ EXECUTAR**
- Acompanhe as instruções Assembly sendo executadas com registradores, flags e pilha atualizando em tempo real

## Assembly real (Linux)

### Requisitos
- Linux x86-64
- `nasm` e `ld` instalados

```bash
# Instalar NASM (Debian/Ubuntu)
sudo apt install nasm

# Compilar
nasm -f elf64 calculadora.asm -o calculadora.o

# Linkar
ld calculadora.o -o calculadora

# Executar
./calculadora
```

### Exemplo de uso
```
Numero A : 42
Operador  (+  -  *  /) : *
Numero B : 7
Resultado : 294
```

## Detalhes técnicos

- **Sem libc** — usa syscalls Linux diretamente (`read`, `write`, `exit`)
- **Convenção** System V AMD64 ABI
- **Operações**: `ADD`, `SUB`, `IMUL`, `IDIV` com detecção de divisão por zero
- **Subrotinas implementadas do zero**: `print_str`, `read_line`, `parse_int`, `int_to_str`

## Syscalls utilizadas

| Número | Nome | Uso |
|---|---|---|
| 0 | `read` | Lê entrada do stdin |
| 1 | `write` | Escreve no stdout |
| 60 | `exit` | Encerra o processo |
