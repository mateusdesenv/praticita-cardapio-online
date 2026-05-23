import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AvailabilityStatus, PriceType } from '../../../../core/models/common.model';
import { OptionGroup } from '../../../../core/models/option-group.model';
import { ProductOption } from '../../../../core/models/product-option.model';
import { ProductVariation } from '../../../../core/models/product-variation.model';
import { Product } from '../../../../core/models/product.model';
import { MenuService } from '../../../../core/services/menu.service';
import { CurrencyBrPipe } from '../../../../shared/pipes/currency-br.pipe';

@Component({
  selector: 'app-product-form-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CurrencyBrPipe],
  template: `
    <div class="admin-header">
      <div>
        <h1>{{ isNew ? 'Novo produto' : 'Editar produto' }}</h1>
        <p>Produto, preço, disponibilidade, variações e opções.</p>
      </div>
      <a class="button-ghost" routerLink="/admin/produtos">Voltar</a>
    </div>

    <section class="form-card">
      <div class="form-grid three">
        <div class="form-field"><label>Nome</label><input class="form-control" [(ngModel)]="form.name"></div>
        <div class="form-field"><label>Slug</label><input class="form-control" [(ngModel)]="form.slug" placeholder="gerado automaticamente"></div>
        <div class="form-field"><label>Categoria</label>
          <select class="form-control" [(ngModel)]="form.categoryId">
            <option value="">Selecione</option>
            <option *ngFor="let category of menu.categories()" [value]="category.id">{{ category.name }}</option>
          </select>
        </div>
        <div class="form-field" style="grid-column: 1 / -1;"><label>Descrição curta</label><input class="form-control" [(ngModel)]="form.shortDescription"></div>
        <div class="form-field" style="grid-column: 1 / -1;"><label>Descrição completa</label><textarea class="form-control" [(ngModel)]="form.fullDescription"></textarea></div>

        <div class="form-field"><label>Tipo de preço</label>
          <select class="form-control" [(ngModel)]="form.priceType">
            <option *ngFor="let type of priceTypes" [value]="type">{{ type }}</option>
          </select>
        </div>
        <div class="form-field"><label>Preço base</label><input class="form-control" type="number" step="0.01" [(ngModel)]="form.basePrice"></div>
        <div class="form-field"><label>Unidade/medida</label><input class="form-control" [(ngModel)]="form.unitLabel" placeholder="unidade, kg, pacote 500g..."></div>
        <div class="form-field"><label>Pedido mínimo</label><input class="form-control" type="number" [(ngModel)]="form.minQuantity"></div>
        <div class="form-field"><label>Antecedência em dias</label><input class="form-control" type="number" [(ngModel)]="form.preparationDays"></div>
        <div class="form-field"><label>Disponibilidade</label>
          <select class="form-control" [(ngModel)]="form.availabilityStatus">
            <option *ngFor="let status of availabilityStatuses" [value]="status">{{ status }}</option>
          </select>
        </div>
        <div class="form-field" style="grid-column: 1 / -1;"><label>Observação de disponibilidade</label><input class="form-control" [(ngModel)]="form.availabilityNote"></div>
        <div class="form-field" style="grid-column: 1 / -1;"><label>Observação de preço/regra comercial</label><textarea class="form-control" [(ngModel)]="form.pricingNote"></textarea></div>
        <div class="form-field"><label>Ordem</label><input class="form-control" type="number" [(ngModel)]="form.displayOrder"></div>
        <label class="checkbox-row"><input type="checkbox" [(ngModel)]="form.isFeatured"> Destaque</label>
        <label class="checkbox-row"><input type="checkbox" [(ngModel)]="form.isActive"> Ativo</label>
      </div>
      <div class="form-actions">
        <button class="button" (click)="saveProduct()">Salvar produto</button>
      </div>
    </section>

    <section class="form-card" *ngIf="!isNew && currentProduct() as product">
      <h2>Variações</h2>
      <p>Use para tamanhos, pesos ou versões com preço diferente.</p>

      <div class="form-grid three">
        <div class="form-field"><label>Nome</label><input class="form-control" [(ngModel)]="variationForm.name" placeholder="P, M, G, 20 cm..."></div>
        <div class="form-field"><label>Medida</label><input class="form-control" [(ngModel)]="variationForm.sizeLabel"></div>
        <div class="form-field"><label>Preço</label><input class="form-control" type="number" step="0.01" [(ngModel)]="variationForm.price"></div>
        <div class="form-field"><label>Peso</label><input class="form-control" [(ngModel)]="variationForm.weightLabel"></div>
        <div class="form-field"><label>Serve/fatias</label><input class="form-control" [(ngModel)]="variationForm.servesLabel"></div>
        <div class="form-field"><label>Ordem</label><input class="form-control" type="number" [(ngModel)]="variationForm.displayOrder"></div>
        <label class="checkbox-row"><input type="checkbox" [(ngModel)]="variationForm.isActive"> Ativa</label>
      </div>
      <div class="form-actions">
        <button class="button-secondary" (click)="saveVariation(product)">{{ editingVariationId ? 'Atualizar variação' : 'Adicionar variação' }}</button>
        <button class="button-ghost" *ngIf="editingVariationId" (click)="resetVariationForm()">Cancelar</button>
      </div>

      <div class="variation-list" style="margin-top: 16px;">
        <div class="variation-item" *ngFor="let variation of variations(product.id)">
          <span><strong>{{ variation.name }}</strong> · {{ variation.sizeLabel || 'sem medida' }} · {{ variation.price | currencyBr }}</span>
          <span class="table-actions">
            <button class="button-ghost" (click)="editVariation(variation)">Editar</button>
            <button class="button-danger" (click)="deleteVariation(variation)">Excluir</button>
          </span>
        </div>
      </div>
    </section>

    <section class="form-card" *ngIf="!isNew && currentProduct() as product">
      <h2>Grupos de opções</h2>
      <p>Use para massa, recheios, coberturas e sabores.</p>

      <div class="form-grid three">
        <div class="form-field"><label>Nome do grupo</label><input class="form-control" [(ngModel)]="groupForm.name" placeholder="Massa, Recheios..."></div>
        <div class="form-field"><label>Mínimo</label><input class="form-control" type="number" [(ngModel)]="groupForm.minSelect"></div>
        <div class="form-field"><label>Máximo</label><input class="form-control" type="number" [(ngModel)]="groupForm.maxSelect"></div>
        <div class="form-field"><label>Ordem</label><input class="form-control" type="number" [(ngModel)]="groupForm.displayOrder"></div>
        <label class="checkbox-row"><input type="checkbox" [(ngModel)]="groupForm.isRequired"> Obrigatório</label>
      </div>
      <div class="form-actions">
        <button class="button-secondary" (click)="saveGroup(product)">{{ editingGroupId ? 'Atualizar grupo' : 'Adicionar grupo' }}</button>
        <button class="button-ghost" *ngIf="editingGroupId" (click)="resetGroupForm()">Cancelar</button>
      </div>

      <div class="nested-panel" *ngFor="let group of optionGroups(product.id)">
        <div class="admin-header" style="margin-bottom: 8px;">
          <div>
            <h3>{{ group.name }}</h3>
            <p>Mín. {{ group.minSelect }} · Máx. {{ group.maxSelect }} · {{ group.isRequired ? 'Obrigatório' : 'Opcional' }}</p>
          </div>
          <span class="table-actions">
            <button class="button-ghost" (click)="editGroup(group)">Editar grupo</button>
            <button class="button-danger" (click)="deleteGroup(group)">Excluir grupo</button>
          </span>
        </div>

        <div class="form-grid three">
          <input class="form-control" placeholder="Nova opção" [(ngModel)]="optionDrafts[group.id].name">
          <input class="form-control" type="number" step="0.01" placeholder="Adicional" [(ngModel)]="optionDrafts[group.id].additionalPrice">
          <button class="button-secondary" (click)="addOption(group)">Adicionar opção</button>
        </div>

        <div class="variation-list" style="margin-top: 12px;">
          <div class="variation-item" *ngFor="let option of group.options">
            <span>{{ option.name }} <strong *ngIf="option.additionalPrice > 0">+ {{ option.additionalPrice | currencyBr }}</strong></span>
            <span class="table-actions">
              <button class="button-ghost" (click)="toggleOption(option)">{{ option.isActive ? 'Inativar' : 'Ativar' }}</button>
              <button class="button-danger" (click)="deleteOption(option)">Excluir</button>
            </span>
          </div>
        </div>
      </div>
    </section>
  `
})
export class ProductFormPageComponent implements OnInit {
  readonly menu = inject(MenuService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  isNew = true;
  productId: string | null = null;
  priceTypes: PriceType[] = ['fixed', 'variation', 'unit', 'hundred', 'kg', 'package', 'quote'];
  availabilityStatuses: AvailabilityStatus[] = ['available', 'unavailable', 'on_request', 'quote'];

  form = this.blankProductForm();
  editingVariationId: string | null = null;
  variationForm = this.blankVariationForm();
  editingGroupId: string | null = null;
  groupForm = this.blankGroupForm();
  optionDrafts: Record<string, { name: string; additionalPrice: number }> = {};

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isNew = !id;
    this.productId = id;

    if (id) {
      const product = this.menu.getProductById(id);
      if (product) {
        this.form = { ...product };
        this.seedOptionDrafts();
      }
    }
  }

  currentProduct(): Product | undefined {
    return this.productId ? this.menu.getProductById(this.productId) : undefined;
  }

  variations(productId: string): ProductVariation[] {
    return this.menu.getVariationsByProduct(productId);
  }

  optionGroups(productId: string) {
    const groups = this.menu.getOptionGroupsByProduct(productId);
    groups.forEach((group) => {
      this.optionDrafts[group.id] ??= { name: '', additionalPrice: 0 };
    });
    return groups;
  }

  async saveProduct(): Promise<void> {
    if (!this.form.name.trim()) return alert('Informe o nome do produto.');
    if (!this.form.categoryId) return alert('Selecione uma categoria.');

    if (this.isNew) {
      const created = await this.menu.createProduct(this.form);
      await this.router.navigate(['/admin/produtos', created.id]);
      this.isNew = false;
      this.productId = created.id;
    } else if (this.productId) {
      await this.menu.updateProduct(this.productId, this.form);
    }
  }

  async saveVariation(product: Product): Promise<void> {
    if (!this.variationForm.name.trim()) return alert('Informe o nome da variação.');

    if (this.editingVariationId) {
      await this.menu.updateVariation(this.editingVariationId, this.variationForm);
    } else {
      await this.menu.createVariation({ ...this.variationForm, productId: product.id });
    }
    this.resetVariationForm();
  }

  editVariation(variation: ProductVariation): void {
    this.editingVariationId = variation.id;
    this.variationForm = { ...variation };
  }

  async deleteVariation(variation: ProductVariation): Promise<void> {
    if (!confirm(`Excluir variação "${variation.name}"?`)) return;
    await this.menu.deleteVariation(variation.id);
  }

  resetVariationForm(): void {
    this.editingVariationId = null;
    this.variationForm = this.blankVariationForm();
  }

  async saveGroup(product: Product): Promise<void> {
    if (!this.groupForm.name.trim()) return alert('Informe o nome do grupo.');

    if (this.editingGroupId) {
      await this.menu.updateOptionGroup(this.editingGroupId, this.groupForm);
    } else {
      const group = await this.menu.createOptionGroup({ ...this.groupForm, productId: product.id });
      this.optionDrafts[group.id] = { name: '', additionalPrice: 0 };
    }
    this.resetGroupForm();
  }

  editGroup(group: OptionGroup): void {
    this.editingGroupId = group.id;
    this.groupForm = { ...group };
  }

  async deleteGroup(group: OptionGroup): Promise<void> {
    if (!confirm(`Excluir grupo "${group.name}" e suas opções?`)) return;
    await this.menu.deleteOptionGroup(group.id);
  }

  resetGroupForm(): void {
    this.editingGroupId = null;
    this.groupForm = this.blankGroupForm();
  }

  async addOption(group: OptionGroup): Promise<void> {
    const draft = this.optionDrafts[group.id];
    if (!draft?.name.trim()) return;
    await this.menu.createProductOption({
      optionGroupId: group.id,
      name: draft.name,
      additionalPrice: Number(draft.additionalPrice ?? 0),
      isActive: true,
      displayOrder: group.displayOrder + group.id.length
    });
    this.optionDrafts[group.id] = { name: '', additionalPrice: 0 };
  }

  async toggleOption(option: ProductOption): Promise<void> {
    await this.menu.updateProductOption(option.id, { isActive: !option.isActive });
  }

  async deleteOption(option: ProductOption): Promise<void> {
    await this.menu.deleteProductOption(option.id);
  }

  private seedOptionDrafts(): void {
    if (!this.productId) return;
    this.menu.getOptionGroupsByProduct(this.productId).forEach((group) => {
      this.optionDrafts[group.id] = { name: '', additionalPrice: 0 };
    });
  }

  private blankProductForm(): Product {
    return {
      id: '', categoryId: '', name: '', slug: '', shortDescription: '', fullDescription: '', imageUrl: null,
      priceType: 'fixed', basePrice: null, unitLabel: '', minQuantity: null, preparationDays: null, availabilityStatus: 'available',
      availabilityNote: '', pricingNote: '', isFeatured: false, displayOrder: this.menu.products().length + 1, isActive: true,
      createdAt: '', updatedAt: ''
    };
  }

  private blankVariationForm(): ProductVariation {
    return { id: '', productId: '', name: '', sizeLabel: '', weightLabel: '', servesLabel: '', price: 0, unitLabel: '', minQuantity: null, displayOrder: 1, isActive: true, createdAt: '', updatedAt: '' };
  }

  private blankGroupForm(): OptionGroup {
    return { id: '', productId: '', name: '', minSelect: 0, maxSelect: 1, isRequired: false, displayOrder: 1, createdAt: '', updatedAt: '' };
  }
}
