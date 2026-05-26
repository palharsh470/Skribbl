import Lobby from "./pages/Lobby";
import "../src/App.css"

export default function App() {

    const [gameInfo, setGameInfo] = useState(null);
    const socketRef = useRef(null);
    const [socket, setSocket] = useState(null);


    const handleJoin = ({ roomId, playerName, avatar }) => {
        socketRef.current?.disconnect();
        const s = io(window.location.origin, { transports: ["websocket"] });
        socketRef.current = s;
        setSocket(s);

        s.on("connect", () => {
            s.emit("join-room", { roomId, playerName, avatar });
        });

        s.on("joined", (payload) => {
            const player = payload?.player ?? payload;
            const room = payload?.room;
            setGameInfo({ roomId, player, room });
            setView("game");
        });


        s.on("error", (err) => {
            const message = err?.message ?? err ?? "Unknown error";
            alert("Error: " + message);
            s.disconnect();
            setSocket(null);
        });

        s.on("connect_error", (err) => {
            const message = err?.message ?? String(err);
            alert("Connection failed: " + message);
            s.disconnect();
            setSocket(null);
        });
    };

    useEffect(() => {
        return () => socketRef.current?.disconnect();
    }, []);



    return (
        <Lobby handleJoin={handleJoin} />
    )
}