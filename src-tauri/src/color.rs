use tauri::AppHandle;

/// Sichqoncha kursori ostidagi piksel rangini "#RRGGBB" koʻrinishida qaytaradi.
///
/// macOS: birinchi marta "Ekranni yozib olish" (Screen Recording) ruxsati soʻraladi.
pub fn pick_at_cursor(app: &AppHandle) -> Result<String, String> {
    let pos = app.cursor_position().map_err(|e| e.to_string())?;
    let monitors = xcap::Monitor::all().map_err(|e| e.to_string())?;

    for m in monitors {
        let (mx, my) = (m.x().map_err(es)?, m.y().map_err(es)?);
        let (mw, mh) = (m.width().map_err(es)?, m.height().map_err(es)?);

        // macOS'da xcap "point" birligida ishlaydi, Tauri esa fizik piksel beradi.
        // Windows'da ikkalasi ham fizik pikselda.
        #[cfg(target_os = "macos")]
        let scale = m.scale_factor().unwrap_or(1.0) as f64;
        #[cfg(not(target_os = "macos"))]
        let scale = 1.0_f64;

        let (px, py) = (pos.x / scale, pos.y / scale);
        let inside = px >= mx as f64
            && py >= my as f64
            && px < mx as f64 + mw as f64
            && py < my as f64 + mh as f64;
        if !inside {
            continue;
        }

        let rx = ((px - mx as f64).floor() as u32).min(mw.saturating_sub(1));
        let ry = ((py - my as f64).floor() as u32).min(mh.saturating_sub(1));
        let img = m.capture_region(rx, ry, 1, 1).map_err(es)?;
        let p = img.get_pixel(0, 0);
        return Ok(format!("#{:02X}{:02X}{:02X}", p[0], p[1], p[2]));
    }
    Err("Kursor ostidagi ekran topilmadi".into())
}

fn es<E: std::fmt::Display>(e: E) -> String {
    e.to_string()
}

#[tauri::command]
pub fn pick_color(app: AppHandle) -> Result<String, String> {
    pick_at_cursor(&app)
}
