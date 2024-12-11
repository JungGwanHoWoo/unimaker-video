const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;
const videoPath = path.join(__dirname, 'video.mp4'); // 동영상 파일 경로

const server = http.createServer((req, res) => {
    if (req.url === '/video') {
        const stat = fs.statSync(videoPath); // 동영상 파일 정보
        const fileSize = stat.size; // 파일 크기
        const range = req.headers.range;

        if (range) {
            // Range 헤더가 있는 경우 (부분 스트리밍)
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

            if (start >= fileSize || end >= fileSize) {
                res.writeHead(416, { "Content-Range": `bytes */${fileSize}` });
                return res.end();
            }

            const chunkSize = (end - start) + 1;
            const file = fs.createReadStream(videoPath, { start, end });
            const headers = {
                "Content-Range": `bytes ${start}-${end}/${fileSize}`,
                "Accept-Ranges": "bytes",
                "Content-Length": chunkSize,
                "Content-Type": "video/mp4",
            };

            res.writeHead(206, headers); // 206 Partial Content
            file.pipe(res);
        } else {
            // Range 헤더가 없는 경우 (전체 스트리밍)
            const headers = {
                "Content-Length": fileSize,
                "Content-Type": "video/mp4",
            };

            res.writeHead(200, headers);
            fs.createReadStream(videoPath).pipe(res);
        }
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
