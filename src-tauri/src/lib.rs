mod color;
mod stats;

use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, WindowEvent,
};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

fn show_main(app: &AppHandle) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.show();
        let _ = w.unminimize();
        let _ = w.set_focus();
    }
}

fn toggle_main(app: &AppHandle) {
    if let Some(w) = app.get_webview_window("main") {
        let visible = w.is_visible().unwrap_or(false);
        let focused = w.is_focused().unwrap_or(false);
        if visible && focused {
            let _ = w.hide();
        } else {
            show_main(app);
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let toggle = Shortcut::new(Some(Modifiers::ALT), Code::Space);
    let picker = Shortcut::new(Some(Modifiers::ALT | Modifiers::SHIFT), Code::KeyC);
    let (toggle_id, picker_id) = (toggle.id(), picker.id());

    tauri::Builder::default()
        // Ikkinchi nusxa ochilsa — mavjud oynani koʻrsatamiz
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| show_main(app)))
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, Some(vec!["--hidden"])))
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(move |app, shortcut, event| {
                    if event.state() != ShortcutState::Pressed {
                        return;
                    }
                    if shortcut.id() == toggle_id {
                        toggle_main(app);
                    } else if shortcut.id() == picker_id {
                        match color::pick_at_cursor(app) {
                            Ok(hex) => {
                                let _ = app.emit("color-picked", hex);
                            }
                            Err(e) => {
                                let _ = app.emit("color-error", e);
                            }
                        }
                    }
                })
                .build(),
        )
        .manage(stats::StatsState(std::sync::Mutex::new(stats::Stats::new().ok())))
        .invoke_handler(tauri::generate_handler![stats::system_stats, color::pick_color])
        .setup(move |app| {
            // macOS: Dock'da ikonka koʻrinmasin — faqat menyu panelida
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            for (s, name) in [(toggle, "Alt+Space"), (picker, "Alt+Shift+C")] {
                if let Err(e) = app.global_shortcut().register(s) {
                    eprintln!("[tezkor] {name} tugmasini roʻyxatdan oʻtkazib boʻlmadi: {e}");
                }
            }

            let show_i = MenuItem::with_id(app, "show", "Tezkor'ni ochish", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Chiqish", true, None::<&str>)?;
            let sep = PredefinedMenuItem::separator(app)?;
            let menu = Menu::with_items(app, &[&show_i, &sep, &quit_i])?;

            let tray_icon = tauri::image::Image::from_bytes(include_bytes!("../icons/tray.png"))?;
            TrayIconBuilder::with_id("main")
                .icon(tray_icon)
                .icon_as_template(true)
                .tooltip("Tezkor — Alt+Space")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, e| match e.id.as_ref() {
                    "show" => show_main(app),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, e| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = e
                    {
                        toggle_main(tray.app_handle());
                    }
                })
                .build(app)?;

            // Avtozapuskda yashirin ochiladi, qoʻlda ochilganda — koʻrinadi
            if !std::env::args().any(|a| a == "--hidden") {
                show_main(app.handle());
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            // Asosiy oyna yopilganda dastur trayda qoladi
            if let WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main" {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("Tezkor'ni ishga tushirib boʻlmadi");
}
