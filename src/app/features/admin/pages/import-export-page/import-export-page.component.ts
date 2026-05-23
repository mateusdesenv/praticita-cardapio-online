import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { MenuService } from '../../../../core/services/menu.service';
import { MenuData, PublicMenuSection } from '../../../../core/models/menu-data.model';
import { Product } from '../../../../core/models/product.model';
import { ProductOption } from '../../../../core/models/product-option.model';
import { ProductVariation } from '../../../../core/models/product-variation.model';
import { formatCurrencyBR } from '../../../../core/utils/currency.util';

@Component({
  selector: 'app-import-export-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-header">
      <div>
        <h1>Importar / Exportar</h1>
        <p>Backup manual dos dados salvos em localStorage.</p>
      </div>
    </div>

    <section class="form-card">
      <h2>Backup JSON</h2>
      <p>Use antes de limpar o navegador ou antes da futura migração para Node.js + MongoDB.</p>
      <div class="form-actions">
        <button class="button" (click)="exportJson()">Exportar JSON</button>
        <button class="button-secondary" (click)="fileInput.click()">Importar JSON</button>
        <button class="button-ghost" (click)="resetSeed()">Restaurar seed inicial</button>
      </div>
      <input #fileInput type="file" accept="application/json" hidden (change)="importJson($event)">
    </section>

    <section class="form-card">
      <h2>PDF do cardápio</h2>
      <p>Gere uma versão imprimível do cardápio público atual para salvar ou enviar em PDF.</p>
      <div class="form-actions">
        <button class="button" (click)="exportPdf()">Exportar PDF</button>
      </div>
    </section>

    <section class="form-card">
      <h2>Dados atuais</h2>
      <div class="stats-grid">
        <div class="stat-card"><span>Categorias</span><strong>{{ menu.categories().length }}</strong></div>
        <div class="stat-card"><span>Produtos</span><strong>{{ menu.products().length }}</strong></div>
        <div class="stat-card"><span>Variações</span><strong>{{ menu.variations().length }}</strong></div>
        <div class="stat-card"><span>Opções</span><strong>{{ menu.productOptions().length }}</strong></div>
      </div>
    </section>
  `
})
export class ImportExportPageComponent {
  readonly menu = inject(MenuService);
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  async exportJson(): Promise<void> {
    const data = await this.menu.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `praticita-cardapio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  exportPdf(): void {
    const sections = this.menu.getPublicSections();
    if (!sections.length) {
      alert('Não há produtos ativos no cardápio público para exportar.');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    if (!printWindow) {
      alert('Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-ups.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(this.buildMenuPdfHtml(sections));
    printWindow.document.close();
    printWindow.focus();
  }

  async importJson(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const text = await file.text();
    try {
      const data = JSON.parse(text) as MenuData;
      if (!confirm('Importar este JSON e sobrescrever os dados locais?')) return;
      await this.menu.importData(data);
      alert('Dados importados com sucesso.');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Arquivo JSON inválido.');
    } finally {
      if (this.fileInput) this.fileInput.nativeElement.value = '';
    }
  }

  async resetSeed(): Promise<void> {
    if (!confirm('Restaurar o cardápio inicial e sobrescrever os dados locais?')) return;
    await this.menu.resetToSeed();
  }

  private buildMenuPdfHtml(sections: PublicMenuSection[]): string {
    const settings = this.menu.businessSettings();
    const generatedAt = new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'long',
      timeStyle: 'short'
    }).format(new Date());

    const address = [settings.address, settings.neighborhood].filter(Boolean).join(' - ');
    const introNotes = [settings.slogan, settings.businessSubtitle, settings.deliveryNote, settings.quoteNote]
      .filter(Boolean)
      .map((note) => `<p>${this.escapeHtml(note)}</p>`)
      .join('');

    const sectionMarkup = sections.map((section) => `
      <section class="category">
        <header>
          <h2>${this.escapeHtml(section.name)}</h2>
          ${section.description ? `<p>${this.escapeHtml(section.description)}</p>` : ''}
        </header>
        <div class="product-list">
          ${section.products.map((product) => this.buildProductMarkup(product)).join('')}
        </div>
      </section>
    `).join('');

    return `
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <title>${this.escapeHtml(settings.businessName)} - Cardápio</title>
    <style>
      @page { size: A4; margin: 14mm; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        color: #3e1811;
        background: #fffaf6;
        font-family: Arial, sans-serif;
        line-height: 1.45;
      }
      .page { max-width: 760px; margin: 0 auto; }
      .cover {
        border-bottom: 2px solid #ead8cd;
        margin-bottom: 20px;
        padding-bottom: 18px;
      }
      .cover h1 {
        margin: 0 0 8px;
        color: #3e1811;
        font-size: 30px;
        line-height: 1.1;
      }
      .cover p, .meta p, .category header p, .details, .notes {
        margin: 0;
        color: #6f5148;
        font-size: 12px;
      }
      .meta {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px 18px;
        margin-top: 14px;
      }
      .category {
        break-inside: avoid;
        margin: 0 0 20px;
      }
      .category header {
        border-bottom: 1px solid #ead8cd;
        margin-bottom: 10px;
        padding-bottom: 7px;
      }
      .category h2 {
        margin: 0 0 4px;
        color: #5a2118;
        font-size: 20px;
      }
      .product {
        break-inside: avoid;
        border-bottom: 1px solid #f0e1d8;
        padding: 10px 0;
      }
      .product-title {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 16px;
      }
      .product-title h3 {
        margin: 0;
        font-size: 15px;
      }
      .price {
        color: #5a2118;
        font-size: 13px;
        font-weight: 700;
        white-space: nowrap;
      }
      .description {
        margin: 4px 0 0;
        color: #6f5148;
        font-size: 12px;
      }
      .details {
        margin-top: 5px;
      }
      .notes {
        margin-top: 5px;
        font-style: italic;
      }
      .sublist {
        margin: 7px 0 0;
        padding: 7px 0 0 14px;
        color: #4b2a22;
        font-size: 12px;
      }
      .sublist li { margin-bottom: 3px; }
      .group-title {
        margin-top: 7px;
        color: #5a2118;
        font-size: 12px;
        font-weight: 700;
      }
      @media print {
        body { background: #fff; }
        .page { max-width: none; }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <header class="cover">
        <h1>${this.escapeHtml(settings.businessName)}</h1>
        ${introNotes}
        <div class="meta">
          ${settings.whatsapp ? `<p><strong>WhatsApp:</strong> ${this.escapeHtml(settings.whatsapp)}</p>` : ''}
          ${address ? `<p><strong>Endereço:</strong> ${this.escapeHtml(address)}</p>` : ''}
          <p><strong>Gerado em:</strong> ${this.escapeHtml(generatedAt)}</p>
        </div>
      </header>
      ${sectionMarkup}
    </main>
    <script>
      window.addEventListener('load', () => {
        window.print();
      });
    </script>
  </body>
</html>`;
  }

  private buildProductMarkup(product: PublicMenuSection['products'][number]): string {
    const description = product.fullDescription || product.shortDescription;
    const details = [
      product.minQuantity ? `Pedido mínimo: ${product.minQuantity}` : '',
      product.preparationDays ? `Preparo: ${product.preparationDays} dia(s)` : ''
    ].filter(Boolean).join(' | ');
    const notes = [product.pricingNote, product.availabilityNote].filter(Boolean).join(' | ');
    const variations = this.buildVariationsMarkup(product.variations);
    const options = this.buildOptionGroupsMarkup(product.optionGroups);

    return `
      <article class="product">
        <div class="product-title">
          <h3>${this.escapeHtml(product.name)}</h3>
          <span class="price">${this.escapeHtml(this.menu.getPriceLabel(product as Product))}</span>
        </div>
        ${description ? `<p class="description">${this.escapeHtml(description)}</p>` : ''}
        ${details ? `<p class="details">${this.escapeHtml(details)}</p>` : ''}
        ${notes ? `<p class="notes">${this.escapeHtml(notes)}</p>` : ''}
        ${variations}
        ${options}
      </article>
    `;
  }

  private buildVariationsMarkup(variations: ProductVariation[]): string {
    if (!variations.length) return '';

    return `
      <ul class="sublist">
        ${variations.map((variation) => {
          const labels = [variation.sizeLabel, variation.weightLabel, variation.servesLabel].filter(Boolean).join(' - ');
          const minQuantity = variation.minQuantity ? ` - mínimo ${variation.minQuantity}` : '';
          return `<li>${this.escapeHtml(variation.name)}${labels ? ` (${this.escapeHtml(labels)})` : ''}: ${this.escapeHtml(formatCurrencyBR(variation.price))}${this.escapeHtml(minQuantity)}</li>`;
        }).join('')}
      </ul>
    `;
  }

  private buildOptionGroupsMarkup(productGroups: PublicMenuSection['products'][number]['optionGroups']): string {
    if (!productGroups.length) return '';

    return productGroups.map((group) => `
      <p class="group-title">${this.escapeHtml(group.name)}</p>
      <ul class="sublist">
        ${group.options.map((option) => `<li>${this.escapeHtml(this.formatOption(option))}</li>`).join('')}
      </ul>
    `).join('');
  }

  private formatOption(option: ProductOption): string {
    if (!option.additionalPrice) return option.name;
    return `${option.name} (+ ${formatCurrencyBR(option.additionalPrice)})`;
  }

  private escapeHtml(value: unknown): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
