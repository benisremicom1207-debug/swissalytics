import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentions légales | Swissalytics',
  description: 'Mentions légales, politique de confidentialité et conditions d\'utilisation de Swissalytics.',
};

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <main className="container mx-auto px-4 py-16 max-w-3xl">
        <a href="/" className="text-blue-600 hover:underline text-sm mb-8 inline-block">&larr; Retour à l&apos;analyse</a>

        <h1 className="text-4xl font-bold mb-12">Mentions l&eacute;gales</h1>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">&Eacute;diteur</h2>
          <p className="text-gray-700 leading-relaxed">
            Swissalytics est un service gratuit propuls&eacute; par <strong>Pixelab</strong>.<br />
            Si&egrave;ge : Gen&egrave;ve, Suisse<br />
            Contact : <a href="https://pixelab.ch/contact" className="text-blue-600 hover:underline">pixelab.ch/contact</a>
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">H&eacute;bergement</h2>
          <p className="text-gray-700 leading-relaxed">
            Ce site est h&eacute;berg&eacute; exclusivement en Suisse par <strong>Infomaniak Network SA</strong>,<br />
            Rue Eugène-Marziano 25, 1227 Les Acacias (GE), Suisse.<br />
            Aucune donn&eacute;e ne transite en dehors de la Suisse.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Protection des donn&eacute;es (nLPD)</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Conform&eacute;ment &agrave; la nouvelle Loi f&eacute;d&eacute;rale sur la protection des donn&eacute;es (nLPD, en vigueur depuis le 1er septembre 2023) :
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Swissalytics <strong>ne collecte aucune donn&eacute;e personnelle</strong> de ses utilisateurs.</li>
            <li>Aucun compte utilisateur n&apos;est requis.</li>
            <li>Aucun cookie de tracking n&apos;est utilis&eacute;.</li>
            <li>Les URL analys&eacute;es ne sont <strong>ni stock&eacute;es ni enregistr&eacute;es</strong>.</li>
            <li>Les r&eacute;sultats d&apos;analyse sont calcul&eacute;s en temps r&eacute;el et ne sont pas conserv&eacute;s sur nos serveurs.</li>
            <li>Aucune donn&eacute;e n&apos;est transmise &agrave; des tiers.</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Propri&eacute;t&eacute; intellectuelle</h2>
          <p className="text-gray-700 leading-relaxed">
            Le contenu de ce site (textes, graphiques, code source) est prot&eacute;g&eacute; par le droit d&apos;auteur.
            La marque Swissalytics est une propri&eacute;t&eacute; de Pixelab.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Limitation de responsabilit&eacute;</h2>
          <p className="text-gray-700 leading-relaxed">
            Les r&eacute;sultats d&apos;analyse fournis par Swissalytics sont donn&eacute;s &agrave; titre indicatif.
            Ils ne constituent pas un conseil professionnel en r&eacute;f&eacute;rencement.
            Pixelab d&eacute;cline toute responsabilit&eacute; quant aux d&eacute;cisions prises sur la base de ces r&eacute;sultats.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Droit applicable</h2>
          <p className="text-gray-700 leading-relaxed">
            Le droit suisse est applicable. Le for juridique est &agrave; Gen&egrave;ve, Suisse.
          </p>
        </section>
      </main>
    </div>
  );
}
