import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

export const SUPPORTED_LANGS = ["fi", "en", "et", "ru"] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

/** Language used when none is requested, or an unsupported one is. */
export const FALLBACK_LANG: Lang = "fi";

/** Type guard narrowing an arbitrary string to a supported UI language. */
export const isSupportedLang = (value?: string | null): value is Lang =>
  !!value && (SUPPORTED_LANGS as readonly string[]).includes(value);

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: FALLBACK_LANG,
    supportedLngs: SUPPORTED_LANGS as unknown as string[],
    interpolation: { escapeValue: false },
    detection: {
      order: [
        "htmlTag",
        "querystring",
        "localStorage",
        "sessionStorage",
        "navigator",
        "path",
        "subdomain",
      ],
      caches: ["localStorage"],
    },
    resources: {
      en: {
        translation: {
          no_store_title: "Your store isn't configured for chat support yet.",
          no_store_body:
            "Please ask your store administrator to configure this store for the chat assistant.",
          ok: "OK",
          header_title: "Renkaat247",
          support_agent: "Support agent",
          online: "Online",
          message_placeholder: "Message...",
          greeting:
            "👋 **Let's try to find suitable tires for your vehicle! Please tell us what vehicle do you have and what kind of tires are you looking for!**",
          ai_agent: "AI Agent",
          user: "User",
          data_not_available: "Data not available",
          error_occurred:
            "An error occurred while processing your request. Please try again later.",
          store_unavailable:
            "This store isn't set up for chat support yet. Please contact the store for assistance.",
          disclaimer_title: "Please note! ",
          disclaimer_text:
            "For better accuracy in tyre recommendations, please upload image of the vehicle side and of current tires by uploading images or by using the QR code below. You can also load images from your folder by clicking the paper clip symbol. If your vehicle has different tire size in front and rear axle, please take pictures from both axles.",
          upload_via_qr: "UPLOAD IMAGE VIA QR",
          scan_to_upload: "Scan to Upload",
          scan_to_upload_desc:
            "Scan this QR code with your phone camera to upload images directly.",
          in_stock: "In Stock",
          out_of_stock: "Out of Stock",
          only_left: "Only {{count}} left!",
          count_in_stock: "{{count}} in stock",
          price_not_available: "Price not available",
          description: "Description",
          eu_label: "EU Label",
          wet_grip: "Wet Grip",
          rolling_resistance: "Rolling Resistance",
          noise: "Noise",
          view_and_buy: "View & Buy",
          launcher_title: "Need new tyres?",
          launcher_subtitle: "Let our AI help you choose",
        },
      },
      fi: {
        translation: {
          no_store_title:
            "Kauppaasi ei ole vielä määritetty chat-tukea varten.",
          no_store_body:
            "Pyydä kaupan ylläpitäjää määrittämään tämä kauppa chat-avustajaa varten.",
          ok: "OK",
          header_title: "Renkaat247",
          support_agent: "Asiakaspalvelija",
          online: "Paikalla",
          message_placeholder: "Viesti...",
          greeting:
            "👋 **Etsitään autoosi sopivat renkaat. Anna minulle ajoneuvosi tiedot ja minkälaisia renkaita etsit!**",
          ai_agent: "Tekoälybotti",
          user: "Käyttäjä",
          data_not_available: "Tietoa ei saatavilla",
          error_occurred:
            "Virhe käsiteltäessä pyyntöäsi. Yritä myöhemmin uudelleen.",
          store_unavailable:
            "Tätä myymälää ei ole vielä otettu käyttöön chat-tukea varten. Ota yhteyttä myymälään saadaksesi apua.",
          disclaimer_title: "Huomio! ",
          disclaimer_text:
            "Tarkempien suositusten antamiseksi, lataa kuva autosi sivuprofiilista ja renkaasta. Voit käyttää alla olevaa QR-koodia tai voit ladata kuvat tiedostoistasi käyttämällä paperiliitin-kuvaketta. Jos autossa on eri rengaskoko etu- ja taka-akselilla, ota kuvat kummankin akselin renkaasta.",
          upload_via_qr: "LATAA KUVA QR-KOODILLA",
          scan_to_upload: "Skannaa ladataksesi",
          scan_to_upload_desc:
            "Skannaa tämä QR-koodi puhelimesi kameralla ladataksesi kuvat suoraan.",
          in_stock: "Varastossa",
          out_of_stock: "Loppunut varastosta",
          only_left: "Vain {{count}} jäljellä!",
          count_in_stock: "{{count}} varastossa",
          price_not_available: "Hinta ei saatavilla",
          description: "Kuvaus",
          eu_label: "EU-merkintä",
          wet_grip: "Märkäpito",
          rolling_resistance: "Vierintävastus",
          noise: "Melu",
          view_and_buy: "Katso & Osta",
          launcher_title: "Tarvitsetko uudet renkaat?",
          launcher_subtitle: "Anna tekoälyn auttaa valinnassa",
        },
      },
      et: {
        translation: {
          no_store_title: "Teie pood ei ole veel vestlustoe jaoks seadistatud.",
          no_store_body:
            "Palun paluge poe administraatoril see pood vestlusassistendi jaoks seadistada.",
          ok: "OK",
          header_title: "Renkaat247",
          support_agent: "Klienditugi",
          online: "Võrgus",
          message_placeholder: "Sõnum...",
          greeting:
            "👋 **Leiame teie sõidukile sobivad rehvid! Palun öelge, milline sõiduk teil on ja milliseid rehve otsite!**",
          ai_agent: "AI-agent",
          user: "Kasutaja",
          data_not_available: "Andmed pole saadaval",
          error_occurred:
            "Teie päringu töötlemisel tekkis viga. Palun proovige hiljem uuesti.",
          store_unavailable:
            "See pood ei ole veel vestlustoe jaoks seadistatud. Palun võtke abi saamiseks poega ühendust.",
          disclaimer_title: "Pange tähele! ",
          disclaimer_text:
            "Rehvisoovituste täpsuse parandamiseks laadige palun üles pilt sõiduki küljest ja praegustest rehvidest, kasutades allolevat QR-koodi. Pilte saate lisada ka oma kaustast, klõpsates kirjaklambri ikoonil. Kui teie sõidukil on esi- ja tagateljel erineva suurusega rehvid, tehke palun pildid mõlemast teljest.",
          upload_via_qr: "LAADI PILT ÜLES QR-KOODIGA",
          scan_to_upload: "Skanni üleslaadimiseks",
          scan_to_upload_desc:
            "Skannige see QR-kood oma telefoni kaameraga, et pilte otse üles laadida.",
          in_stock: "Laos",
          out_of_stock: "Otsas",
          only_left: "Ainult {{count}} järel!",
          count_in_stock: "{{count}} laos",
          price_not_available: "Hind pole saadaval",
          description: "Kirjeldus",
          eu_label: "EL-i märgis",
          wet_grip: "Märghaardumine",
          rolling_resistance: "Veeretakistus",
          noise: "Müra",
          view_and_buy: "Vaata & Osta",
          launcher_title: "Vajad uusi rehve?",
          launcher_subtitle: "Lase tehisintellektil valida aidata",
        },
      },
      ru: {
        translation: {
          no_store_title: "Ваш магазин ещё не настроен для чат-поддержки.",
          no_store_body:
            "Пожалуйста, попросите администратора магазина настроить этот магазин для чат-ассистента.",
          ok: "ОК",
          header_title: "Renkaat247",
          support_agent: "Агент поддержки",
          online: "В сети",
          message_placeholder: "Сообщение...",
          greeting:
            "👋 **Давайте подберём подходящие шины для вашего автомобиля! Пожалуйста, укажите, какой у вас автомобиль и какие шины вы ищете!**",
          ai_agent: "ИИ-агент",
          user: "Пользователь",
          data_not_available: "Данные недоступны",
          error_occurred:
            "При обработке вашего запроса произошла ошибка. Пожалуйста, попробуйте позже.",
          store_unavailable:
            "Этот магазин ещё не подключён к чат-поддержке. Пожалуйста, свяжитесь с магазином для получения помощи.",
          disclaimer_title: "Обратите внимание! ",
          disclaimer_text:
            "Для повышения точности рекомендаций по шинам, пожалуйста, загрузите фотографию автомобиля сбоку и текущих шин с помощью QR-кода ниже. Вы также можете загрузить изображения из своей папки, нажав на значок скрепки. Если на передней и задней осях вашего автомобиля установлены шины разного размера, сделайте, пожалуйста, фотографии обеих осей.",
          upload_via_qr: "ЗАГРУЗИТЬ ФОТО ПО QR-КОДУ",
          scan_to_upload: "Сканируйте для загрузки",
          scan_to_upload_desc:
            "Отсканируйте этот QR-код камерой телефона, чтобы загрузить изображения напрямую.",
          in_stock: "В наличии",
          out_of_stock: "Нет в наличии",
          only_left: "Осталось только {{count}}!",
          count_in_stock: "{{count}} в наличии",
          price_not_available: "Цена недоступна",
          description: "Описание",
          eu_label: "Маркировка ЕС",
          wet_grip: "Сцепление на мокрой дороге",
          rolling_resistance: "Сопротивление качению",
          noise: "Шум",
          view_and_buy: "Посмотреть и купить",
          launcher_title: "Нужны новые шины?",
          launcher_subtitle: "Позвольте ИИ помочь с выбором",
        },
      },
    },
  });

export default i18n;
