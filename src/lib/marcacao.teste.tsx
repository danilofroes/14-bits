import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Marcacao, MarcacaoInline } from './marcacao'

describe('Marcacao', () => {
  it('quebra em parágrafos por linha em branco', () => {
    const { container } = render(<Marcacao conteudo={'Primeiro.\n\nSegundo.'} />)
    expect(container.querySelectorAll('p')).toHaveLength(2)
  })

  it('renderiza negrito, itálico e código', () => {
    const { container } = render(<Marcacao conteudo="Um **bit** é *ligado* ou `0`." />)
    expect(container.querySelector('strong')?.textContent).toBe('bit')
    expect(container.querySelector('em')?.textContent).toBe('ligado')
    expect(container.querySelector('code')?.textContent).toBe('0')
  })

  it('não deixa asterisco vazar para a tela', () => {
    const { container } = render(<Marcacao conteudo="**Santos Dumont** voou." />)
    expect(container.textContent).toBe('Santos Dumont voou.')
    expect(container.textContent).not.toContain('*')
  })

  it('não interpreta HTML vindo do conteúdo', () => {
    const { container } = render(<Marcacao conteudo="<script>alerta()</script>" />)
    expect(container.querySelector('script')).toBeNull()
    expect(container.textContent).toContain('<script>')
  })
})

describe('MarcacaoInline', () => {
  // Regressão: a pergunta do quiz e o texto das alternativas chegavam a
  // aparecer com os asteriscos literais na tela.
  it('formata sem envolver em parágrafo', () => {
    const { container } = render(<MarcacaoInline conteudo="Com **um único bit**?" />)
    expect(container.querySelector('p')).toBeNull()
    expect(container.querySelector('strong')?.textContent).toBe('um único bit')
    expect(container.textContent).toBe('Com um único bit?')
  })

  it('junta quebras de linha simples num espaço só', () => {
    render(<MarcacaoInline conteudo={'Uma pergunta\n  quebrada em duas linhas'} />)
    expect(screen.getByText('Uma pergunta quebrada em duas linhas')).toBeTruthy()
  })
})
