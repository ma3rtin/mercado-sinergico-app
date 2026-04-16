import { Injectable } from '@angular/core';
import { NgIconsModule } from '@ng-icons/core';

// 📦 Importar los iconos de feather que necesites
import {
  // ➕ Navegación
  featherChevronRight,
  featherChevronLeft,
  featherArrowRight,
  featherArrowLeft,
  featherMenu,
  featherX,
  featherHome,
  featherPlus,
  featherMoreVertical,


  // 🔍 Búsqueda y Filtros
  featherSearch,
  featherFilter,
  featherSliders,

  // 💰 Precios y Dinero
  featherDollarSign,
  featherShoppingCart,
  featherShoppingBag,
  featherTrendingUp,
  featherTrendingDown,

  // ✅ Estados y Validación
  featherCheck,
  featherCheckCircle,
  featherAlertCircle,
  featherAlertTriangle,
  featherInfo,
  featherX as featherXIcon,

  // 👤 Usuario y Perfil
  featherUser,
  featherUsers,
  featherUserCheck,
  featherLogOut,
  featherLogIn,

  // 📦 Productos y Paquetes
  featherBox,
  featherPackage,
  featherGift,
  featherStar,
  featherHeart,

  // 🗺️ Ubicación
  featherMapPin,
  featherMap,
  featherNavigation,

  // ⚙️ Configuración
  featherSettings,
  featherEdit,
  featherEdit2,
  featherTrash,
  featherTrash2,
  featherCopy,

  // 📋 Documentos
  featherFile,
  featherFileText,
  featherFilePlus,
  featherFileMinus,

  // ⏰ Tiempo
  featherClock,
  featherCalendar,

  // 📊 Datos
  featherBarChart2,
  featherPieChart,
  featherTrendingUp as featherTrendingUpIcon,

  // 🔗 Links y Acciones
  featherLink,
  featherExternalLink,
  featherDownload,
  featherUpload,
  featherShare2,

  // 🎨 UI
  featherEye,
  featherEyeOff,
  featherLoader,
  featherRefreshCw,
  featherChevronDown,
  featherChevronUp,

  // 📱 Misc
  featherPhone,
  featherMail,
  featherBell,
  featherZap,
  featherLayers,

  // 🆕 NUEVOS para buscador
  featherMeh,
  featherFrown,
  featherSmile,
  featherTag,
  featherArchive,
  featherClipboard,
  featherAward,
  featherGrid,
  featherList,
  featherMinusCircle,
  featherAlertOctagon,
  featherLock,
  featherHash,
  featherTruck,
  featherInbox,
  featherImage,
  featherLifeBuoy,
  featherMessageCircle,
  featherShield,
  featherHelpCircle,
} from '@ng-icons/feather-icons';

@Injectable({
  providedIn: 'root'
})
export class IconsService {

  // 📋 Mapeo centralizado de iconos
  public readonly icons = {
    // ➕ Navegación
    chevronRight: featherChevronRight,
    chevronLeft: featherChevronLeft,
    chevronDown: featherChevronDown,
    chevronUp: featherChevronUp,
    arrowRight: featherArrowRight,
    arrowLeft: featherArrowLeft,
    menu: featherMenu,
    close: featherX,
    home: featherHome,
    plus: featherPlus,
    moreVertical: featherMoreVertical,

    // 🔍 Búsqueda
    search: featherSearch,
    filter: featherFilter,
    sliders: featherSliders,

    // 💰 Precios
    dollar: featherDollarSign,
    cart: featherShoppingCart,
    bag: featherShoppingBag,
    shoppingBag: featherShoppingBag,
    trendingUp: featherTrendingUp,
    trendingDown: featherTrendingDown,

    // ✅ Estados
    check: featherCheck,
    checkCircle: featherCheckCircle,
    alert: featherAlertCircle,
    alertTriangle: featherAlertTriangle,
    info: featherInfo,

    // 👤 Usuario
    user: featherUser,
    users: featherUsers,
    userCheck: featherUserCheck,
    logout: featherLogOut,
    login: featherLogIn,

    // 📦 Productos
    box: featherBox,
    package: featherPackage,
    gift: featherGift,
    star: featherStar,
    heart: featherHeart,
    tag: featherTag,

    // 🗺️ Ubicación
    mapPin: featherMapPin,
    map: featherMap,
    navigation: featherNavigation,

    // ⚙️ Configuración
    settings: featherSettings,
    edit: featherEdit,
    edit2: featherEdit2,
    trash: featherTrash,
    trash2: featherTrash2,
    copy: featherCopy,

    // ⏰ Tiempo
    clock: featherClock,
    calendar: featherCalendar,

    // 📊 Datos
    barChart: featherBarChart2,
    pieChart: featherPieChart,

    // 🔗 Links
    link: featherLink,
    externalLink: featherExternalLink,
    download: featherDownload,
    upload: featherUpload,
    share: featherShare2,

    // 🎨 UI
    eye: featherEye,
    eyeOff: featherEyeOff,
    loader: featherLoader,
    refresh: featherRefreshCw,
    save: featherFilePlus,

    // 📱 Misc
    phone: featherPhone,
    mail: featherMail,
    bell: featherBell,
    zap: featherZap,
    layers: featherLayers,
    lock: featherLock,
    hash: featherHash,
    truck: featherTruck,
    inbox: featherInbox,
    image: featherImage,
    support: featherLifeBuoy,
    contact: featherMessageCircle,
    legal: featherShield,
    helpCircle: featherHelpCircle,

    // 📋 Documentos
    file: featherFile,
    fileText: featherFileText,
    filePlus: featherFilePlus,
    fileMinus: featherFileMinus,

    // 😊 Emociones
    meh: featherMeh,
    frown: featherFrown,
    smile: featherSmile,

    // 🔤 Aliases con mayúsculas (para compatibilidad)
    Box: featherBox,
    TrendingUp: featherTrendingUpIcon,
    X: featherXIcon,
    Heart: featherHeart,
    Star: featherStar,
    Map: featherMap,
    Loader: featherLoader,
    Calendar: featherCalendar,
    Logout: featherLogOut,
    MapPin: featherMapPin,
    Search: featherSearch,
    ShoppingBag: featherShoppingBag,
    Package: featherPackage,
    ChevronRight: featherChevronRight,
    ChevronLeft: featherChevronLeft,
    AlertCircle: featherAlertCircle,
    Meh: featherMeh,
    Frown: featherFrown,
    Tag: featherTag,
    Archive: featherArchive,
    Clipboard: featherClipboard,
    Award: featherAward,
    Grid: featherGrid,
    List: featherList,
    MinusCircle: featherMinusCircle,
    AlertOctagon: featherAlertOctagon,
    Plus: featherPlus,
    MoreVertical: featherMoreVertical,


  };

  /**
   * Obtener un icono por su nombre
   */
  getIcon(name: keyof typeof this.icons) {
    return this.icons[name];
  }

  /**
   * Obtener todos los iconos disponibles
   */
  getAllIcons() {
    return this.icons;
  }
}

// 📌 EXPORTAR los módulos necesarios
export { NgIconsModule };
