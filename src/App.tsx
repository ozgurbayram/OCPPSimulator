import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ChargePointConnection from './pages/ChargePointConnection';
import Dashboard from './pages/Dashboard';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Dashboard />} />
        <Route path='/cp/:id' element={<ChargePointConnection />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
