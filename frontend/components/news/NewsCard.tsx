import type {
  NewsArticle,
} from "./NewsPanel";


type Props = {
  article: NewsArticle;
};


// ============================================================
// FORMAT DATE
// ============================================================

function formatPublishedTime(
  publishedAt?: string
) {

  if (!publishedAt) {
    return "Recently";
  }

  const date =
    new Date(publishedAt);

  if (Number.isNaN(
    date.getTime()
  )) {
    return "Recently";
  }

  const now =
    new Date();

  const diff =
    now.getTime()
    - date.getTime();

  const minutes =
    Math.floor(
      diff / 60000
    );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  if (hours < 24) {
    return `${hours} hr ago`;
  }

  const days =
    Math.floor(
      hours / 24
    );

  if (days < 7) {
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }

  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
}


// ============================================================
// NEWS CARD
// ============================================================

export default function NewsCard({
  article,
}: Props) {

  return (

    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="
        group
        rounded-2xl
        bg-[#111c2e]
        border
        border-slate-800
        overflow-hidden
        hover:border-slate-600
        hover:-translate-y-1
        transition-all
        duration-300
        shadow-lg
        block
      "
    >

      {/* ==================================================
          IMAGE
      ================================================== */}

      <div className="
        relative
        h-56
        bg-slate-800
        overflow-hidden
      ">

        {article.image ? (

          <img
            src={article.image}
            alt={article.title}
            className="
              w-full
              h-full
              object-cover
              group-hover:scale-105
              transition-transform
              duration-500
            "
            loading="lazy"
            onError={(event) => {

              event.currentTarget.style.display =
                "none";

            }}
          />

        ) : (

          <div className="
            w-full
            h-full
            flex
            items-center
            justify-center
            bg-gradient-to-br
            from-slate-800
            to-slate-900
          ">

            <div className="text-center">

              <div className="text-4xl mb-2">
                📰
              </div>

              <p className="text-slate-500 text-sm">
                KANCHHI News
              </p>

            </div>

          </div>

        )}


        {/* IMAGE OVERLAY */}

        <div className="
          absolute
          inset-0
          bg-gradient-to-t
          from-black/70
          via-transparent
          to-transparent
          pointer-events-none
        " />


        {/* SOURCE */}

        <div className="
          absolute
          top-4
          left-4
        ">

          <span className="
            px-3
            py-1.5
            rounded-full
            bg-black/60
            backdrop-blur-md
            text-xs
            font-semibold
            text-white
          ">

            {article.source}

          </span>

        </div>


        {/* CATEGORY */}

        <div className="
          absolute
          top-4
          right-4
        ">

          <span className="
            px-3
            py-1.5
            rounded-full
            bg-blue-600/80
            backdrop-blur-md
            text-xs
            font-semibold
            text-white
          ">

            {article.category}

          </span>

        </div>

      </div>


      {/* ==================================================
          CONTENT
      ================================================== */}

      <div className="p-6">

        {/* META */}

        <div className="
          flex
          items-center
          justify-between
          gap-3
          mb-3
        ">

          <span className="
            text-xs
            font-medium
            text-blue-400
          ">

            {article.source}

          </span>


          <span className="
            text-xs
            text-slate-500
          ">

            {formatPublishedTime(
              article.publishedAt
            )}

          </span>

        </div>


        {/* TITLE */}

        <h3 className="
          text-xl
          font-bold
          leading-snug
          group-hover:text-blue-400
          transition-colors
          line-clamp-3
        ">

          {article.title}

        </h3>


        {/* DESCRIPTION */}

        {article.description && (

          <p className="
            text-sm
            text-slate-400
            leading-relaxed
            mt-4
            line-clamp-3
          ">

            {article.description}

          </p>

        )}


        {/* FOOTER */}

        <div className="
          mt-5
          pt-4
          border-t
          border-slate-800
          flex
          justify-between
          items-center
        ">

          <div className="flex flex-col">

            <span className="
              text-xs
              text-slate-500
            ">
              Read full story
            </span>

            <span className="
              text-xs
              text-slate-600
              mt-1
            ">
              {article.category}
            </span>

          </div>


          <span className="
            text-blue-400
            text-lg
            group-hover:translate-x-1
            transition-transform
          ">
            →
          </span>

        </div>

      </div>

    </a>

  );
}