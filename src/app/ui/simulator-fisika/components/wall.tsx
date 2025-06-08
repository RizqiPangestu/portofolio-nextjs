type WallProps = {
    height: number; // height in pixels
};

export default function Wall({ height }: WallProps) {
    return (
        <div
            className="bg-gray-400 shadow-gray-800 shadow-sm rounded-md w-6"
            style={{ height: `${height}px` }}
        >
        </div>
    );
}
