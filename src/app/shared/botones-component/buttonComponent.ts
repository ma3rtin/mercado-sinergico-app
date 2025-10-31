import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'app-button',
    standalone: true,
    templateUrl: './buttonComponent.html'
})
export class ButtonComponent {
    @Input() variant: 'primary' | 'secondary' | 'warning' | 'tertiary' = 'primary';
    @Input() type: 'button' | 'submit' | 'reset' = 'button';
    @Input() label?: string;
    @Input() disabled: boolean = false;
    @Input() loading: boolean = false;
    @Output() buttonClick = new EventEmitter<void>();
    @Input() selected: boolean = false;
    constructor() { }


    get buttonClasses(): string {
        const base = 'inline-flex items-center justify-center px-4 py-2 rounded-lg font-semibold transition-colors shadow-sm focus:outline-none hover:shadow-md cursor-pointer';

        const variants: Record<string, string> = {
            primary: 'bg-yellow-400 text-gray-900 hover:bg-yellow-500 focus:ring-yellow-500',
            secondary: 'bg-primary text-white hover:bg-secondary focus:ring-blue-600',
            tertiary: 'border-2 border-secondary text-secondary hover:bg-gray-100 focus:outline-none focus:ring-0 focus:border-secondary-dark focus:text-secondary-dark focus:shadow-md focus:shadow-secondary-dark',
            warning: 'border-2 border-red-500 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-0 focus:border-red-600 focus:text-red-600 focus:shadow-md focus:shadow-red-600'
        };

        // 🚀 Si está seleccionado → ignora el variant y aplica un set fijo
        if (this.selected) {
            return `${base} border-3 border-secondary-dark bg-yellow-50 text-secondary-dark shadow-md shadow-secondary-dark z-10`;
        }
        const disabledClasses = 'opacity-50 cursor-not-allowed';

        return `${base} ${variants[this.variant]} ${this.disabled ? disabledClasses : ''}`;
    }

    handleClick() {
        if (!this.disabled && !this.loading) {
            this.buttonClick.emit();
        }
    }
}
