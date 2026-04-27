use pyo3::prelude::*;

mod config;
mod sim;

#[pymodule]
fn radio_sim(m: &Bound<'_, PyModule>) -> PyResult<()> {
    m.add_class::<config::PySimConfig>()?;
    m.add_class::<sim::PySim>()?;
    Ok(())
}
