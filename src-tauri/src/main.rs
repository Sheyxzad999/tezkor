// Windows'da release build'da konsol oynasi ochilmasin
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tezkor_lib::run()
}
