import { BrowserRouter } from 'react-router-dom';
import { DashboardLayout } from './components/DashboardLayout';

const App = () => {
  return (
    <BrowserRouter>
      <DashboardLayout>
        <div>Welcome to the EV Station Dashboard!</div>
      </DashboardLayout>
    </BrowserRouter>
  );
};

export default App;
