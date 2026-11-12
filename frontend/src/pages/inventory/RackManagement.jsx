import React, { useState, useEffect } from 'react';
import { Plus, Grid3x3, ChevronRight } from 'lucide-react';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { api } from '../../api';

export default function RackManagement({ setPageTitle }) {
  const [racks, setRacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [selFloor, setSelFloor] = useState('all');
  const [form, setForm] = useState({ floor:'Ground Floor', department:'Mens', rack_no:'', shelf:'S-A', position:'P-1' });

  useEffect(() => {
    setPageTitle({ title: 'Rack Management', sub: 'Inventory Module' });
    load();
  }, []);

  const load = () => {
    setLoading(true);
    api.get('/inventory/racks').then(d => { setRacks(d); setLoading(false); }).catch(() => setLoading(false));
  };

  const save = async () => {
    await api.post('/inventory/racks', form);
    setModal(false);
    setForm({ floor:'Ground Floor', department:'Mens', rack_no:'', shelf:'S-A', position:'P-1' });
    load();
  };

  const floors = ['all', ...new Set(racks.map(r=>r.floor))];
  const filtered = selFloor==='all'?racks:racks.filter(r=>r.floor===selFloor);

  const columns = [
    { key:'floor', label:'Floor', render:v=><span className="badge badge-blue">{v}</span> },
    { key:'department', label:'Department', render:v=><strong>{v}</strong> },
    { key:'rack_no', label:'Rack No', render:v=><span style={{fontFamily:'monospace',fontWeight:700}}>{v}</span> },
    { key:'shelf', label:'Shelf' },
    { key:'position', label:'Position' },
    { key:'products_count', label:'Products', render:v=><span className="badge badge-purple">{v}</span> },
    { key:'total_qty', label:'Total Units', render:v=><span className="td-num">{v}</span> },
  ];

  const floors2 = [...new Set(racks.map(r=>r.floor))];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Rack Management</h2>
          <p>Floor, department, rack, shelf and position records</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={()=>setModal(true)}><Plus size={14}/> Add Rack</button>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Racks" value={racks.length} icon={<Grid3x3 size={20}/>} color="blue" />
        <StatCard label="Floors" value={floors2.length} icon={<Grid3x3 size={20}/>} color="purple" />
        <StatCard label="Departments" value={new Set(racks.map(r=>r.department)).size} icon={<Grid3x3 size={20}/>} color="green" />
        <StatCard label="Total Capacity Units" value={racks.reduce((s,r)=>s+(r.total_qty||0),0)} icon={<Grid3x3 size={20}/>} color="gold" />
      </div>

      <div style={{ marginBottom:20, display:'flex', gap:16, flexWrap:'wrap' }}>
        {floors2.map(floor => {
          const floorRacks = racks.filter(r=>r.floor===floor);
          const depts = [...new Set(floorRacks.map(r=>r.department))];
          return (
            <div key={floor} className="card" style={{ flex:1, minWidth:200 }}>
              <div className="card-title" style={{ marginBottom:12 }}>{floor}</div>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:8 }}>{floorRacks.length} racks · {depts.length} departments</div>
              {depts.map(dept => (
                <div key={dept} style={{ display:'flex', justifyContent:'space-between', fontSize:13, padding:'5px 0', borderBottom:'1px solid var(--border)' }}>
                  <span>{dept}</span>
                  <span className="badge badge-blue">{floorRacks.filter(r=>r.department===dept).length} racks</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">All Racks</div>
          <div style={{ display:'flex', gap:6 }}>
            {floors.map(f=>(
              <button key={f} className={`btn btn-sm ${selFloor===f?'btn-primary':'btn-ghost'}`} onClick={()=>setSelFloor(f)}>{f}</button>
            ))}
          </div>
        </div>
        <DataTable columns={columns} data={filtered} loading={loading} />
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title="Add New Rack"
        footer={<><button className="btn btn-ghost btn-sm" onClick={()=>setModal(false)}>Cancel</button><button className="btn btn-primary btn-sm" onClick={save}>Save Rack</button></>}>
        <div className="form-grid form-grid-2" style={{gap:14}}>
          <div className="form-group">
            <label>Floor</label>
            <select value={form.floor} onChange={e=>setForm({...form,floor:e.target.value})}>
              {['Ground Floor','First Floor','Basement'].map(f=><option key={f}>{f}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Department</label>
            <select value={form.department} onChange={e=>setForm({...form,department:e.target.value})}>
              {['Mens','Ladies','Kids','Sports','Formal','Casual','Storage','Display','Clearance'].map(d=><option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Rack Number</label><input value={form.rack_no} onChange={e=>setForm({...form,rack_no:e.target.value})} placeholder="R-01"/></div>
          <div className="form-group"><label>Shelf</label><input value={form.shelf} onChange={e=>setForm({...form,shelf:e.target.value})} placeholder="S-A"/></div>
          <div className="form-group"><label>Position</label><input value={form.position} onChange={e=>setForm({...form,position:e.target.value})} placeholder="P-1"/></div>
        </div>
      </Modal>
    </div>
  );
}
