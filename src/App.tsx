import { AnalyticsTracker } from './components/AnalyticsTracker';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { SEO } from './components/SEO';
import ChargePointConnection from './pages/ChargePointConnection';
import Dashboard from './pages/Dashboard';

const App = () => {
  return (
    <HashRouter>
      <SEO />
      <AnalyticsTracker />
      <Routes>
        <Route path='/' element={<Dashboard />} />
        <Route path='/cp/:id' element={<ChargePointConnection />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
