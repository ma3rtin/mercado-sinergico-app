import { Router } from '@angular/router';
import { render, screen, fireEvent, waitFor } from '@testing-library/angular';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { CrearProductoComponent } from './crear-producto';
import { ToastrService } from 'ngx-toastr';
import { PlantillaService } from '@app/services/plantilla/plantilla.service';
import { MarcaService } from '@app/services/producto/marca.service';
import { CategoriaService } from '@app/services/producto/categoria.service';
import { ProductosService } from '@app/services/producto/producto.service';



describe('CrearProductoComponent (con Vitest)', () => {
  // Mocks de servicios
  const mockToastrService = {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  };

  const mockPlantillaService = {
    getPlantillas: vi.fn(),
  };

  const mockMarcaService = {
    getMarcas: vi.fn(),
  };

  const mockCategoriaService = {
    getCategorias: vi.fn(),
  };

  const mockProductosService = {
    createProduct: vi.fn(),
  };
const mockRouter = {
  navigate: vi.fn(() => of(true))
};
  // Datos mock
  const mockMarcas = [
    { id_marca: 1, nombre: 'Marca 1' },
    { id_marca: 2, nombre: 'Marca 2' },
  ];

  const mockCategorias = [
    { id_categoria: 1, nombre: 'Categoría 1' },
    { id_categoria: 2, nombre: 'Categoría 2' },
  ];

  const mockPlantillas = [
    {
      id: 1,
      nombre: 'Plantilla 1',
      caracteristicas: [
        {
          id: 1,
          nombre: 'Color',
          opciones: [
            { id: 1, nombre: 'Rojo' },
            { id: 2, nombre: 'Azul' },
          ],
        },
      ],
    },
  ];

  const renderComponent = async () => {
    mockPlantillaService.getPlantillas.mockReturnValue(of(mockPlantillas));
    mockMarcaService.getMarcas.mockReturnValue(of(mockMarcas));
    mockCategoriaService.getCategorias.mockReturnValue(of(mockCategorias));

    return await render(CrearProductoComponent, {
      imports: [FormsModule, ReactiveFormsModule],
      providers: [
        { provide: ToastrService, useValue: mockToastrService },
        { provide: PlantillaService, useValue: mockPlantillaService },
        { provide: MarcaService, useValue: mockMarcaService },
        { provide: CategoriaService, useValue: mockCategoriaService },
        { provide: ProductosService, useValue: mockProductosService },
        { provide: Router, useValue: mockRouter },
      ],
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Renderizado del formulario', () => {
    it('debería renderizar todos los campos básicos del formulario', async () => {
      await renderComponent();

      expect(screen.getByPlaceholderText(/casco reversible/i)).toBeInTheDocument();
      expect(screen.getByText(/elegí una marca/i)).toBeInTheDocument();
      expect(screen.getByText(/elegí una categoría/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/descripción de tu producto/i)).toBeInTheDocument();
    });

    it('debería renderizar los campos de precio y stock', async () => {
      await renderComponent();

      expect(screen.getByPlaceholderText('4000')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/cantidad disponible/i)).toBeInTheDocument();
    });

    it('debería renderizar los campos de dimensiones y peso', async () => {
      await renderComponent();

      const anchoInput = screen.getAllByPlaceholderText('10')[0];
      const alturaInput = screen.getAllByPlaceholderText('10')[1];
      const profundidadInput = screen.getByPlaceholderText('12');
      const pesoInput = screen.getByPlaceholderText('5');

      expect(anchoInput).toBeInTheDocument();
      expect(alturaInput).toBeInTheDocument();
      expect(profundidadInput).toBeInTheDocument();
      expect(pesoInput).toBeInTheDocument();
    });

    it('debería renderizar el botón de crear producto', async () => {
      await renderComponent();

      const submitButton = screen.getByRole('button', { name: /crear producto/i });
      expect(submitButton).toBeInTheDocument();
    });

    it('debería cargar las marcas, categorías y plantillas al iniciar', async () => {
      await renderComponent();

      await waitFor(() => {
        expect(mockPlantillaService.getPlantillas).toHaveBeenCalledTimes(1);
        expect(mockMarcaService.getMarcas).toHaveBeenCalledTimes(1);
        expect(mockCategoriaService.getCategorias).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Validaciones de campos requeridos', () => {
    it('debería mostrar error cuando el nombre está vacío y se envía el formulario', async () => {
      const { fixture } = await renderComponent();

      const submitButton = screen.getByRole('button', { name: /crear producto/i });
      await fireEvent.click(submitButton);

      fixture.detectChanges();

      await waitFor(() => {
        expect(screen.getByText(/el nombre es requerido/i)).toBeInTheDocument();
      });
    });

    it('debería mostrar error cuando el nombre tiene menos de 3 caracteres', async () => {
      const { fixture } = await renderComponent();

      const nombreInput = screen.getByPlaceholderText(/casco reversible/i);
      const submitButton = screen.getByRole('button', { name: /crear producto/i });

      await fireEvent.input(nombreInput, { target: { value: 'Ab' } });
      await fireEvent.click(submitButton);

      fixture.detectChanges();

      await waitFor(() => {
        expect(screen.getByText(/el nombre debe tener al menos 3 caracteres/i)).toBeInTheDocument();
      });
    });

    it('debería mostrar error cuando el precio está vacío', async () => {
      const { fixture } = await renderComponent();

      const submitButton = screen.getByRole('button', { name: /crear producto/i });
      await fireEvent.click(submitButton);

      fixture.detectChanges();

      await waitFor(() => {
        expect(screen.getByText(/el precio es requerido/i)).toBeInTheDocument();
      });
    });

    it('debería mostrar error cuando el precio es negativo', async () => {
      const { fixture } = await renderComponent();

      const precioInput = screen.getByPlaceholderText('4000');
      const submitButton = screen.getByRole('button', { name: /crear producto/i });

      await fireEvent.input(precioInput, { target: { value: '-100' } });
      await fireEvent.click(submitButton);

      fixture.detectChanges();

      await waitFor(() => {
        expect(screen.getByText(/el precio debe ser mayor o igual a 0/i)).toBeInTheDocument();
      });
    });

    it('debería mostrar error cuando la marca no está seleccionada', async () => {
      const { fixture } = await renderComponent();

      const submitButton = screen.getByRole('button', { name: /crear producto/i });
      await fireEvent.click(submitButton);

      fixture.detectChanges();

      await waitFor(() => {
        expect(screen.getByText(/la marca es requerido/i)).toBeInTheDocument();
      });
    });

    it('debería mostrar error cuando la categoría no está seleccionada', async () => {
      const { fixture } = await renderComponent();

      const submitButton = screen.getByRole('button', { name: /crear producto/i });
      await fireEvent.click(submitButton);

      fixture.detectChanges();

      await waitFor(() => {
        expect(screen.getByText(/la categoría es requerido/i)).toBeInTheDocument();
      });
    });
  });

  describe('Validación de imagen principal', () => {
    it('debería mostrar error si no hay imagen principal al enviar', async () => {
      const { fixture, container } = await renderComponent();

      // Llenar campos requeridos
      const nombreInput = screen.getByPlaceholderText(/casco reversible/i);
      const precioInput = screen.getByPlaceholderText('4000');
      
      await fireEvent.input(nombreInput, { target: { value: 'Producto Test' } });
      await fireEvent.input(precioInput, { target: { value: '1000' } });

      // Seleccionar marca y categoría
      const marcaSelect = container.querySelector('select[formControlName="marca_id"]') as HTMLSelectElement;
      const categoriaSelect = container.querySelector('select[formControlName="categoria_id"]') as HTMLSelectElement;
      
      await fireEvent.change(marcaSelect, { target: { value: '1' } });
      await fireEvent.change(categoriaSelect, { target: { value: '1' } });

      const submitButton = screen.getByRole('button', { name: /crear producto/i });
      await fireEvent.click(submitButton);

      fixture.detectChanges();

      await waitFor(() => {
        expect(mockToastrService.error).toHaveBeenCalledWith(
          'Debés cargar al menos la imagen principal del producto'
        );
      });
    });

    it('debería mostrar indicador visual cuando falta la imagen principal después del submit', async () => {
      const { fixture } = await renderComponent();

      const submitButton = screen.getByRole('button', { name: /crear producto/i });
      await fireEvent.click(submitButton);

      fixture.detectChanges();

      await waitFor(() => {
        expect(screen.getByText(/⚠️ la imagen principal es obligatoria/i)).toBeInTheDocument();
      });
    });
  });

  describe('Manejo de imágenes', () => {
    it('debería permitir cargar una imagen principal', async () => {
      const { fixture, container } = await renderComponent();

      // Crear un archivo mock
      const file = new File(['contenido'], 'test.jpg', { type: 'image/jpeg' });
      
      // Buscar el primer input de archivo (imagen principal)
      const fileInputs = container.querySelectorAll('input[type="file"]');
      const mainImageInput = fileInputs[0] as HTMLInputElement;

      // Mock de FileReader
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        onload: null as any,
        result: 'data:image/jpeg;base64,mockbase64',
      };

      global.FileReader = vi.fn(() => mockFileReader) as any;

      // Simular selección de archivo
      Object.defineProperty(mainImageInput, 'files', {
        value: [file],
        writable: false,
      });

      await fireEvent.change(mainImageInput);
      
      // Simular carga del FileReader
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: mockFileReader } as any);
      }

      fixture.detectChanges();

      await waitFor(() => {
        // Verificar que el componente tiene la imagen
        const component = fixture.componentInstance;
        expect(component.imageSlots[0].file).toBeTruthy();
      });
    });

    it('debería rechazar archivos que no sean imágenes', async () => {
      const { fixture, container } = await renderComponent();

      const file = new File(['contenido'], 'test.pdf', { type: 'application/pdf' });
      
      const fileInputs = container.querySelectorAll('input[type="file"]');
      const mainImageInput = fileInputs[0] as HTMLInputElement;

      Object.defineProperty(mainImageInput, 'files', {
        value: [file],
        writable: false,
      });

      await fireEvent.change(mainImageInput);
      fixture.detectChanges();

      await waitFor(() => {
        expect(mockToastrService.error).toHaveBeenCalledWith(
          'Solo se permiten archivos de imagen'
        );
      });
    });

    it('debería rechazar imágenes mayores a 5MB', async () => {
      const { fixture, container } = await renderComponent();

      // Crear archivo de 6MB
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { 
        type: 'image/jpeg' 
      });
      
      const fileInputs = container.querySelectorAll('input[type="file"]');
      const mainImageInput = fileInputs[0] as HTMLInputElement;

      Object.defineProperty(mainImageInput, 'files', {
        value: [largeFile],
        writable: false,
      });

      await fireEvent.change(mainImageInput);
      fixture.detectChanges();

      await waitFor(() => {
        expect(mockToastrService.error).toHaveBeenCalledWith(
          'La imagen no puede superar los 5MB'
        );
      });
    });
  });

  describe('Selección de plantilla', () => {
    it('debería permitir seleccionar una plantilla', async () => {
      const { fixture } = await renderComponent();

      await waitFor(() => {
        const plantillaButton = screen.getByRole('button', { name: 'Plantilla 1' });
        expect(plantillaButton).toBeInTheDocument();
      });

      const plantillaButton = screen.getByRole('button', { name: 'Plantilla 1' });
      await fireEvent.click(plantillaButton);

      fixture.detectChanges();

      const component = fixture.componentInstance;
      expect(component.selectedTemplate).toBeTruthy();
      expect(component.selectedTemplate?.id).toBe(1);
    });

    it('debería mostrar las características de la plantilla seleccionada', async () => {
      const { fixture } = await renderComponent();

      await waitFor(() => {
        const plantillaButton = screen.getByRole('button', { name: 'Plantilla 1' });
        expect(plantillaButton).toBeInTheDocument();
      });

      const plantillaButton = screen.getByRole('button', { name: 'Plantilla 1' });
      await fireEvent.click(plantillaButton);

      fixture.detectChanges();

      await waitFor(() => {
        expect(screen.getByText(/color/i)).toBeInTheDocument();
        expect(screen.getByText('Rojo')).toBeInTheDocument();
        expect(screen.getByText('Azul')).toBeInTheDocument();
      });
    });
  });

  describe('Envío del formulario', () => {
    it('debería mostrar error cuando el formulario es inválido', async () => {
      const { fixture } = await renderComponent();

      const submitButton = screen.getByRole('button', { name: /crear producto/i });
      await fireEvent.click(submitButton);

      fixture.detectChanges();

      await waitFor(() => {
        expect(mockToastrService.error).toHaveBeenCalledWith(
          'Por favor completá todos los campos requeridos'
        );
      });
    });

    it('debería crear el producto exitosamente con datos válidos e imagen', async () => {
      const { fixture, container } = await renderComponent();

      // Llenar campos requeridos
      const nombreInput = screen.getByPlaceholderText(/casco reversible/i);
      const precioInput = screen.getByPlaceholderText('4000');
      const descripcionInput = screen.getByPlaceholderText(/descripción de tu producto/i);
      
      await fireEvent.input(nombreInput, { target: { value: 'Producto Test' } });
      await fireEvent.input(precioInput, { target: { value: '1000' } });
      await fireEvent.input(descripcionInput, { target: { value: 'Descripción test' } });

      // Seleccionar marca y categoría
      const marcaSelect = container.querySelector('select[formControlName="marca_id"]') as HTMLSelectElement;
      const categoriaSelect = container.querySelector('select[formControlName="categoria_id"]') as HTMLSelectElement;
      
      await fireEvent.change(marcaSelect, { target: { value: '1' } });
      await fireEvent.change(categoriaSelect, { target: { value: '1' } });

      // Agregar imagen principal
      const component = fixture.componentInstance;
      const mockFile = new File(['contenido'], 'test.jpg', { type: 'image/jpeg' });
      component.imageSlots[0] = { 
        file: mockFile, 
        preview: 'data:image/jpeg;base64,mock' 
      };

      fixture.detectChanges();

      // Mock de respuesta exitosa
      mockProductosService.createProduct.mockReturnValue(
        of({ id_producto: 1, nombre: 'Producto Test' })
      );

      const submitButton = screen.getByRole('button', { name: /crear producto/i });
      await fireEvent.click(submitButton);

      fixture.detectChanges();

      await waitFor(() => {
        expect(mockProductosService.createProduct).toHaveBeenCalled();
        expect(mockToastrService.success).toHaveBeenCalledWith(
          'Producto creado exitosamente 🚀'
        );
      });
    });

    it('debería mostrar error cuando falla la creación del producto', async () => {
      const { fixture, container } = await renderComponent();

      // Llenar formulario válido
      const nombreInput = screen.getByPlaceholderText(/casco reversible/i);
      const precioInput = screen.getByPlaceholderText('4000');
      
      await fireEvent.input(nombreInput, { target: { value: 'Producto Test' } });
      await fireEvent.input(precioInput, { target: { value: '1000' } });

      const marcaSelect = container.querySelector('select[formControlName="marca_id"]') as HTMLSelectElement;
      const categoriaSelect = container.querySelector('select[formControlName="categoria_id"]') as HTMLSelectElement;
      
      await fireEvent.change(marcaSelect, { target: { value: '1' } });
      await fireEvent.change(categoriaSelect, { target: { value: '1' } });

      // Agregar imagen
      const component = fixture.componentInstance;
      const mockFile = new File(['contenido'], 'test.jpg', { type: 'image/jpeg' });
      component.imageSlots[0] = { 
        file: mockFile, 
        preview: 'data:image/jpeg;base64,mock' 
      };

      fixture.detectChanges();

      // Mock de error
      mockProductosService.createProduct.mockReturnValue(
        throwError(() => ({ 
          error: { message: 'Error al crear producto' } 
        }))
      );

      const submitButton = screen.getByRole('button', { name: /crear producto/i });
      await fireEvent.click(submitButton);

      fixture.detectChanges();

      await waitFor(() => {
        expect(mockToastrService.error).toHaveBeenCalledWith('Error al crear producto');
      });
    });

    it('debería enviar FormData con todos los campos al crear producto', async () => {
      const { fixture, container } = await renderComponent();

      // Llenar todos los campos
      const nombreInput = screen.getByPlaceholderText(/casco reversible/i);
      const precioInput = screen.getByPlaceholderText('4000');
      const stockInput = screen.getByPlaceholderText(/cantidad disponible/i);
      const pesoInput = screen.getByPlaceholderText('5');
      
      await fireEvent.input(nombreInput, { target: { value: 'Producto Completo' } });
      await fireEvent.input(precioInput, { target: { value: '2000' } });
      await fireEvent.input(stockInput, { target: { value: '50' } });
      await fireEvent.input(pesoInput, { target: { value: '1.5' } });

      const marcaSelect = container.querySelector('select[formControlName="marca_id"]') as HTMLSelectElement;
      const categoriaSelect = container.querySelector('select[formControlName="categoria_id"]') as HTMLSelectElement;
      
      await fireEvent.change(marcaSelect, { target: { value: '1' } });
      await fireEvent.change(categoriaSelect, { target: { value: '1' } });

      // Agregar imagen
      const component = fixture.componentInstance;
      const mockFile = new File(['contenido'], 'test.jpg', { type: 'image/jpeg' });
      component.imageSlots[0] = { file: mockFile, preview: 'data:image/jpeg;base64,mock' };

      fixture.detectChanges();

      mockProductosService.createProduct.mockReturnValue(of({ id_producto: 1 }));

      const submitButton = screen.getByRole('button', { name: /crear producto/i });
      await fireEvent.click(submitButton);

      fixture.detectChanges();

      await waitFor(() => {
        expect(mockProductosService.createProduct).toHaveBeenCalled();
        const formDataArg = mockProductosService.createProduct.mock.calls[0][0];
        expect(formDataArg).toBeInstanceOf(FormData);
      });
    });
  });

  describe('Reseteo del formulario', () => {
    it('debería resetear el formulario al hacer click en cancelar', async () => {
      const { fixture } = await renderComponent();

      const nombreInput = screen.getByPlaceholderText(/casco reversible/i);
      await fireEvent.input(nombreInput, { target: { value: 'Test' } });

      fixture.detectChanges();

      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      await fireEvent.click(cancelButton);

      fixture.detectChanges();

      const component = fixture.componentInstance;
      expect(component.productForm.get('nombre')?.value).toBeNull();
    });

    it('debería limpiar las imágenes al resetear', async () => {
      const { fixture } = await renderComponent();

      const component = fixture.componentInstance;
      const mockFile = new File(['contenido'], 'test.jpg', { type: 'image/jpeg' });
      component.imageSlots[0] = { file: mockFile, preview: 'data:image/jpeg;base64,mock' };

      fixture.detectChanges();

      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      await fireEvent.click(cancelButton);

      fixture.detectChanges();

      expect(component.imageSlots[0].file).toBeNull();
      expect(component.imageSlots[0].preview).toBeNull();
    });
  });
});
  