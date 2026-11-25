use std::collections::HashSet;
use std::sync::Mutex;
use std::time::Instant;

use serde::Serialize;
use sysinfo::{Disks, Networks, System};

pub struct StatsState(pub Mutex<Option<Stats>>);

pub struct Stats {
    sys: System,
    nets: Networks,
    disks: Disks,
    last: Instant,
    tick: u32,
}

impl Stats {
    pub fn new() -> Result<Self, sysinfo::Error> {
        Ok(Self {
            sys: System::new_all()?,
            nets: Networks::new_with_refreshed_list()?,
            disks: Disks::new_with_refreshed_list()?,
            last: Instant::now(),
            tick: 0,
        })
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiskInfo {
    name: String,
    mount: String,
    total: u64,
    available: u64,
    removable: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemStats {
    cpu: f32,
    cores: Vec<f32>,
    mem_used: u64,
    mem_total: u64,
    swap_used: u64,
    swap_total: u64,
    /// bayt/sekund
    net_rx: f64,
    net_tx: f64,
    disks: Vec<DiskInfo>,
    uptime: u64,
    host: Option<String>,
    os: Option<String>,
}

/// macOS'dagi tizim ichki boʻlimlarini yashiramiz
fn is_visible_disk(mount: &str) -> bool {
    !(mount.starts_with("/System/Volumes")
        || mount.starts_with("/private")
        || mount.starts_with("/dev")
        || mount.starts_with("/Library/Developer"))
}

#[tauri::command]
pub fn system_stats(state: tauri::State<'_, StatsState>) -> Result<SystemStats, String> {
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    let s = guard
        .as_mut()
        .ok_or_else(|| "Bu tizimda maʼlumot olib boʻlmadi".to_string())?;

    s.sys.refresh_cpu_usage();
    s.sys.refresh_memory();
    s.nets.refresh(true);
    // Disklar sekin oʻzgaradi — har 10-chaqiruvda yangilaymiz
    if s.tick == 0 {
        s.disks.refresh(true);
    }
    s.tick = (s.tick + 1) % 10;

    let elapsed = s.last.elapsed().as_secs_f64().max(0.001);
    s.last = Instant::now();
    let (rx, tx) = s
        .nets
        .values()
        .fold((0u64, 0u64), |(r, t), n| (r + n.received(), t + n.transmitted()));

    let mut seen = HashSet::new();
    let disks = s
        .disks
        .iter()
        .filter(|d| d.total_space() > 1_000_000_000)
        .filter(|d| is_visible_disk(&d.mount_point().to_string_lossy()))
        .filter(|d| seen.insert((d.name().to_string_lossy().to_string(), d.total_space())))
        .map(|d| DiskInfo {
            name: d.name().to_string_lossy().to_string(),
            mount: d.mount_point().to_string_lossy().to_string(),
            total: d.total_space(),
            available: d.available_space(),
            removable: d.is_removable(),
        })
        .collect();

    Ok(SystemStats {
        cpu: s.sys.global_cpu_usage(),
        cores: s.sys.cpus().iter().map(|c| c.usage()).collect(),
        mem_used: s.sys.used_memory(),
        mem_total: s.sys.total_memory(),
        swap_used: s.sys.used_swap(),
        swap_total: s.sys.total_swap(),
        net_rx: rx as f64 / elapsed,
        net_tx: tx as f64 / elapsed,
        disks,
        uptime: System::uptime().unwrap_or(0),
        host: System::host_name().ok(),
        os: System::long_os_version().ok(),
    })
}
