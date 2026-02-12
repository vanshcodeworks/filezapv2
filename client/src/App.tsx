import { Routes , Route } from "react-router-dom";
import Peer2Peer from "./Components/Peer2Peer";
import Home from "./Components/Home"
function App(){
  return(
    <>
    <Routes>
        <Route path="/" Component={Home}/>
        <Route path="/Peer2Peer" Component={Peer2Peer}/>
    </Routes>
    </>
  )
}
export default App;