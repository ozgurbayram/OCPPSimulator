import { Analytics } from "@vercel/analytics/next";
import { HashRouter, Route, Routes } from 'react-router-dom';
import ChargePointConnection from './pages/ChargePointConnection';
import Dashboard from './pages/Dashboard';
const App = () => {
  return (
    <HashRouter>
      <Analytics />
      <Routes>
        <Route path='/' element={<Dashboard />} />
        <Route path='/cp/:id' element={<ChargePointConnection />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
