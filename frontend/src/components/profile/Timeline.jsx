function Timeline({ items = [], type }) {
  return (
    <div className="relative border-l border-gray-300 pl-8 space-y-6">
      {items?.map((item, i) => (
        <div key={i} className="relative">
          {/* DOT */}
          <div className="absolute -left-[12px] top-2 w-3 h-3 bg-white border border-gray-400 rounded-full" />

          {/* CONTENT */}
          <div>
            {type === "education" ? (
              <>
                <p className="text-sm text-gray-400">{item.year}</p>
                <p className="font-semibold">{item.school}</p>
                <p className="text-gray-600">{item.degree}</p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-400">{item.duration}</p>
                <p className="font-semibold">
                  {item.role} @ {item.company}
                </p>
                <p className="text-gray-600">{item.description}</p>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default Timeline;
