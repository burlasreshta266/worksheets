import { useRef, useState } from "react";
import { Container, Button, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

function Home() {
    const fileInputRef = useRef(null);
    const navigate = useNavigate();
    const [error, setError] = useState("");

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event) => {
        const selectedFiles = Array.from(event.target.files ?? []);

        if (selectedFiles.length === 0) {
            setError("Please select at least one file.");
            return;
        }

        setError("");
        navigate("/pdf", {
            state: {
                files: selectedFiles,
            },
        });
    };

    return(
        <Container className="vh-100 d-flex justify-content-center align-items-center">

            <Container fluid className="text-center">

                <h1 className="display-4 gradient-text fw-bold">PDF Scanner and Editor</h1>

                <p className="mt-3 lead">Scan and edit your PDFs with ease</p>

                <Form.Control
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="d-none"
                    onChange={handleFileChange}
                />

                <Button variant="primary" className="mt-3 w-25" onClick={handleUploadClick}>
                    Upload Images
                </Button>

                {error && <p className="mt-3 text-danger">{error}</p>}

            </Container>

        </Container>
    )
}

export default Home
