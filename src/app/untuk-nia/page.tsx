import Clock from "./_components/Clock";
import EventPopup from "./_components/EventPopup";

export default function UntukNiaPage() {
  return (
    <section className="relative flex-1 flex flex-col items-center justify-center w-full px-4 py-10">
      <div className="relative z-10 w-full flex items-center justify-center">
        <div className="nia-fade-in w-full flex flex-col items-center">
          <Clock />
        </div>
      </div>

      <EventPopup />
    </section>
  );
}
